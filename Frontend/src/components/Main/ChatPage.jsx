import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast
import "./Main.css";
import Navbar from "../Navbar/Navbar";
import { assets } from "../../assets/assets";
import ChatAPI from "../../config/ChatAPI";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

const botMessageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const ChatPage = ({ user, onLogout }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatRef = useRef(null);
  const { sessionId } = useParams();
  const userId = user?.$id;
  const initializationRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderMessages = ["Thinking...", "Diagnosing...", "Just a sec..."];

  const handleBotResponse = useCallback(
  async (userInput, placeholderId) => {
    // Get user coordinates
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Send lat/lng to the backend
        const data = await ChatAPI.addMessage(userId, sessionId, userInput, latitude, longitude);
        
        if (!data.success) {
          toast.error(data.error);
          setLoading(false);
          return;
        }

        const botMessage = {
          sender: "bot",
          message: data.response,
          urls: data.urls,
          isLocation: data.isLocation, // Capture the location flag
          shops: data.shops,           // Capture the list of places
        };

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === placeholderId ? botMessage : msg
          )
        );
        setLoading(false);
      } catch (error) {
        toast.error("Error fetching response.");
      } finally {
        setIsSending(false);
      }
    }, (err) => {
      toast.error("Location access is required for this feature.");
      setIsSending(false);
    });
  },
  [userId, sessionId]
);

  useEffect(() => {
    const initializeChat = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      //Check if we are coming from a Location Search
      if (state?.fromLocation) {
        const locationMessage = {
          sender: "bot",
          isLocation: true, // New flag to identify location data
          shops: state.shops || [],
          message: `I found ${state.shops?.length || 0} repair shops near you:`,
        };
        setMessages([locationMessage]);
        setLoading(false);
        return; // STOP HERE: Don't call ChatAPI.getHistory
      }

      if (state?.initialMessage && state?.fromMain) {
        const initialMessage = {
          sender: "user",
          message: state.initialMessage,
        };
        const placeholderId = Date.now();
        setMessages([
          initialMessage,
          { id: placeholderId, sender: "bot", message: placeholderMessages[0] },
        ]);

        setLoading(true); // Start loading to enable placeholder cycling
        await handleBotResponse(state.initialMessage, placeholderId);

        navigate(".", { replace: true, state: {} });
      } else {
        try {
          const data = await ChatAPI.getHistory(userId, sessionId);
          if (!data.success) {
            toast.error("Session not found"); // Replaced alert with toast
            navigate("/");
            return;
          }
          setMessages(data.conversation || []);
        } catch (error) {
          console.error("Error fetching conversation history:", error);
          toast.error("Failed to load chat history."); // Added toast for error
        }
      }
    };

    if (userId && sessionId) {
      initializeChat();
    }
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setPlaceholderIndex(
          (prevIndex) => (prevIndex + 1) % placeholderMessages.length,
        );
      }, 2000); // Rotate every second
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", message: input };
      const placeholderId = Date.now();
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
        { id: placeholderId, sender: "bot", message: placeholderMessages[0] },
      ]);
      setInput("");
      setLoading(true); // Disable the button while waiting for the response
      await handleBotResponse(input.trim(), placeholderId);
    }
  };

  return (
    <div className="main">
      <Navbar user={user} onLogout={onLogout} />
      <div className="main-container">
        <div className="chat-section" ref={chatRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-row ${
                message.sender === "user" ? "user-row" : "bot-row"
              }`}
            >
              {message.sender === "bot" && (
                <img
                  src={assets.gemini_icon}
                  alt="Bot Icon"
                  className="message-icon"
                />
              )}
              <motion.div
                className={`message ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
                variants={message.sender === "bot" ? botMessageVariants : {}}
                initial="hidden"
                animate="visible"
              >
                {message.sender === "bot" ? (
                  <>
                    {/* 1. ALWAYS render the bot text with Markdown for consistent font/styling */}
                    <ReactMarkdown
                      className={`bot-formatted-response ${
                        loading && message.id ? "pulse-animation" : ""
                      }`}
                    >
                      {loading && message.id
                        ? placeholderMessages[placeholderIndex]
                        : message.message}
                    </ReactMarkdown>

                    {/* 2. Conditionally render Location Cards BELOW the text if flag is true */}
                    {message.isLocation && (
                      <div className="location-results" style={{ marginTop: "15px" }}>
                        <div
                          className="shop-list"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {message.shops && message.shops.length > 0 ? (
                            message.shops.map((shop, idx) => {
                              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${shop.name} ${shop.vicinity}`
                              )}`;

                              return (
                                <a
                                  key={idx}
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                  }}
                                >
                                  <div
                                    className="shop-card"
                                    style={{
                                      background: "rgba(255, 255, 255, 0.1)",
                                      padding: "12px",
                                      borderRadius: "8px",
                                      border: "1px solid rgba(255, 255, 255, 0.05)",
                                      cursor: "pointer",
                                      transition: "transform 0.2s ease",
                                    }}
                                    onMouseOver={(e) =>
                                      (e.currentTarget.style.transform = "scale(1.02)")
                                    }
                                    onMouseOut={(e) =>
                                      (e.currentTarget.style.transform = "scale(1)")
                                    }
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <strong style={{ fontSize: "16px", color: "#fff" }}>
                                        {shop.name}
                                      </strong>
                                      <span style={{ fontSize: "12px", color: "#4daafc" }}>
                                        View on Maps ↗
                                      </span>
                                    </div>
                                    <p style={{ fontSize: "13px", color: "#ccc", margin: "5px 0" }}>
                                      📍 {shop.vicinity}
                                    </p>
                                    {shop.rating && (
                                      <span style={{ color: "#ffcc00", fontSize: "13px" }}>
                                        ⭐ {shop.rating}
                                      </span>
                                    )}
                                  </div>
                                </a>
                              );
                            })
                          ) : (
                            <p style={{ fontSize: "14px", color: "#888" }}>
                              No nearby options found.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. Display Spare Parts URLs if available */}
                    {message.urls && message.urls.length > 0 && (
                      <div className="urls-container" style={{ marginTop: "10px" }}>
                        {message.urls.map((urlData, idx) => (
                          <a
                            key={idx}
                            href={urlData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bot-url-link"
                          >
                            🔗 {urlData.name || `Link ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="user-text">{message.message}</p>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* MOVED: Now outside main-container and use the fixed class */}
      <div className="main-bottom-fixed">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter your message here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <div
            className="send-icon"
            onClick={handleSend}
            style={{
              opacity: isSending ? 0.5 : 1,
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            <img src={assets.send_icon || ""} alt="Send Icon" />
          </div>
        </div>
        <p className="bottom-info">AI may provide inaccurate information</p>
      </div>
    </div>
  );
};

export default ChatPage;

