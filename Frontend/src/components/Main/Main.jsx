import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Main.css";
import Navbar from "../Navbar/Navbar";
import { assets } from "../../assets/assets";
import botResponses from "../../assets/botResponses.json";
import ChatAPI from "../../config/ChatAPI";

const EMERGENCY_HELPLINES = [
  { label: "Police", number: "100", color: "#e74c3c" },
  { label: "Ambulance", number: "108", color: "#27ae60" },
  { label: "Road Accidents", number: "1073", color: "#e67e22" },
  { label: "Highway Helpline", number: "1033", color: "#8e44ad" },
];

const Main = ({ user, onLogout }) => {
  const [input, setInput] = useState("");
  const [cardMessages, setCardMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const userId = user?.$id || "";

  const getRandomProblemsForCards = () => {
    const keys = Object.keys(botResponses);
    const randomProblems = [];
    while (randomProblems.length < 4) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const randomProblem = botResponses[randomKey];
      if (
        randomProblem &&
        !randomProblems.some((p) => p.title === randomProblem.title)
      ) {
        randomProblems.push({ ...randomProblem, key: randomKey });
      }
    }
    return randomProblems;
  };

  const handleSend = async () => {
    if (!userId) {
      toast.error("User ID is not available");
      return;
    }
    const trimmedInput = input.trim();
    if (trimmedInput) {
      setIsSending(true);
      await createNewSession(trimmedInput);
      setInput("");
    }
  };

  const handleCardClick = async (messageKey) => {
    const selectedProblem = botResponses[messageKey];
    if (selectedProblem) {
      setIsSending(true);
      await createNewSession(selectedProblem.title);
    } else {
      toast.error(`No problem found for key: ${messageKey}`);
    }
  };

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          setIsSending(true);
          const data = await ChatAPI.fetchNearbyShops(latitude, longitude);
          if (data.success) {
            navigate("/chat/location-results", {
              state: { shops: data.results, fromLocation: true },
            });
          }
        } catch {
          toast.error("Could not find nearby shops.");
        } finally {
          setIsSending(false);
        }
      },
      () => toast.error("Please enable location access."),
    );
  };

  const handleNearbyHotels = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          setIsSending(true);
          const data = await ChatAPI.fetchNearbyHotels(latitude, longitude);
          if (data.success) {
            navigate("/chat/location-results", {
              state: {
                shops: data.results,
                fromLocation: true,
                locationType: "hotels",
              },
            });
          } else {
            toast.error(
              data.error || "Could not find nearby hotels. Please try again.",
            );
          }
        } catch (err) {
          toast.error(
            "Could not find nearby hotels. Please check your connection.",
          );
        } finally {
          setIsSending(false);
        }
      },
      () => toast.error("Please enable location access to find nearby hotels."),
    );
  };

  const handleEmergencyCall = (number, label) => {
    toast.info(`Dialing ${label}: ${number}`, { autoClose: 2500 });
    window.location.href = `tel:${number}`;
  };

  const createNewSession = async (message) => {
    try {
      const data = await ChatAPI.createSession(userId, message);
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      navigate(`/chat/${data.sessionId}`, {
        state: { initialMessage: message, fromMain: true },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create a new session. Please try again later.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    setCardMessages(getRandomProblemsForCards());
    inputRef.current?.focus();
  }, []);

  return (
    <div className="main">
      <Navbar user={user} onLogout={onLogout} />

      {/* Scrollable content */}
      <div className="main-scroll">
        <div className="main-container">
          <div className="greet">
            <p>
              <span>Hello, {user?.name}</span>
            </p>
            <p>Try Frequently Asked Questions</p>
          </div>

          <div className="cards">
            <div style={{ gridColumn: "1 / -1" }}>
              <p className="section-label">Quick Assistance</p>
            </div>
            {cardMessages.map((card, index) => (
              <div
                key={card.key || index}
                className="card"
                onClick={() => handleCardClick(card.key)}
              >
                <p>{card.title}</p>
                <img
                  src={assets[card.icon] || ""}
                  alt={card.title}
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            ))}
            <div className="card" onClick={handleLocationSearch}>
              <p>Find Nearest Repair Shops</p>
              <img src={assets.compass_icon} alt="Location" />
            </div>
            <div className="card card-hotels" onClick={handleNearbyHotels}>
              <p>Nearby Hotels &amp; Restaurants</p>
              <span className="card-emoji">🏨</span>
            </div>
          </div>

          <div className="emergency-section">
            <h3 className="emergency-title">🚨 Emergency Helplines</h3>
            <p className="emergency-subtitle">Tap any card to dial instantly</p>
            <div className="emergency-cards">
              {EMERGENCY_HELPLINES.map((item) => (
                <div
                  key={item.number}
                  className="emergency-card"
                  style={{ borderColor: item.color }}
                  onClick={() => handleEmergencyCall(item.number, item.label)}
                >
                  <span className="emergency-label">{item.label}</span>
                  <span
                    className="emergency-number"
                    style={{ color: item.color }}
                  >
                    {item.number}
                  </span>
                  <span
                    className="emergency-call-btn"
                    style={{ background: item.color }}
                  >
                    📞 Call
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search bar — sits at bottom of flex column, never overlaps content */}
      <div className="main-bottom">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter your problem here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
            ref={inputRef}
          />
          <div
            className="send-icon"
            onClick={!isSending ? handleSend : undefined}
            style={{
              opacity: isSending ? 0.5 : 1,
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            <img src={assets.send_icon || ""} alt="Send" />
          </div>
        </div>
        <p className="bottom-info">AI may provide inaccurate information</p>
      </div>
    </div>
  );
};

export default Main;
