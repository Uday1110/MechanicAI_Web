const { v4: uuidv4 } = require("uuid");
const { getChatModel } = require("../components/chatSession");
const axios = require("axios");
// Import the fetchPlaces helper from your location routes
const { fetchPlaces } = require("../routes/locationRoutes");

const llm_url = process.env.LLM;

const chatController = {
  createSession: async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const status = await checkServerStatus();
      if (!status.success) {
        return res.status(503).json(status);
      }

      const sessionId = uuidv4();
      const ChatModel = getChatModel(userId);
      const title = "New Chat";

      const newSession = new ChatModel({
        userId,
        sessionId,
        title,
        conversation: [],
      });

      await newSession.save();
      res.status(201).json({ success: true, sessionId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Failed to create chat session" });
    }
  },

  addMessage: async (req, res) => {
    try {
      // Destructure lat and lng from the request body
      const { userId, sessionId, message, lat, lng } = req.body;

      if (!userId || !sessionId || !message) {
        return res.status(400).json({ error: "Invalid message format" });
      }

      const dbRes = await updateConvo(userId, sessionId, "user", message);
      if (!dbRes) {
        return res.status(500).json({
          success: false,
          response: "Oops! Something went wrong. Please try again",
          error: "Failed to save the message",
        });
      }

      const data = await generate(userId, sessionId, message);
      if (!data.success) {
        return res.status(data.status ? 500 : 503).json(data);
      }

      const sendData = {
        success: true,
        response: data.response,
        title: data.title,
        urls: [],
        isLocation: false, // Default to false
        shops: [],         // Default empty list
        message: "Messages added successfully",
      };

      // --- NEW: Location Integration Logic ---
      const locationMatch = data.response.match(/\[LOCATION_REQ:\s*(\w+)\]/);
      if (locationMatch) {
        const type = locationMatch[1]; 
        const typeMap = {
          'REPAIR': ['car_repair'],
          'SHELTER': ['lodging', 'cafe', 'restaurant'],
          'FUEL': ['gas_station'],
          'EMERGENCY': ['police', 'hospital']
        };

        if (lat && lng && typeMap[type]) {
          try {
            // Fetch real-time data using the helper function
            const places = await fetchPlaces(lat, lng, typeMap[type]);
            sendData.isLocation = true;
            sendData.shops = places;
            // Clean the trigger tag from the text response
            sendData.response = data.response.replace(/\[LOCATION_REQ:.*?\]/g, "").trim();
          } catch (error) {
            console.error("Location Fetch Error:", error);
          }
        }
      }
      // ---------------------------------------

      // Existing SpareParts Logic
      if (data.replacementParts !== null) {
        try {
          const response = await axios.post(`${process.env.SPARE_PARTS_API}/api/parts-list`, {
            parts: data.replacementParts,
            carModel: data.carModel,
          });
          sendData.urls = response.data.data.map(part => {
            return part.url === null ? null : {
              name: part.name,
              url: `${process.env.SPARE_PARTS_API}${part.url}`
            };
          }).filter(part => part !== null);
        } catch (error) {
          console.error("Spare Parts Error:", error);
        }
      }

      res.status(200).json(sendData);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        response: "Oops! Something went wrong. Please try again",
        error: "Failed to send message",
      });
    }
  },

  getHistory: async (req, res) => {
    try {
      const { userId, sessionId } = req.body;
      const ChatModel = getChatModel(userId);
      const data = await ChatModel.findOne({ sessionId });
      if (!data) return res.status(404).json({ error: "Chat not found" });
      res.status(200).json({ success: true, conversation: data.conversation });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch history" });
    }
  },

  getChats: async (req, res) => {
    try {
      const { userId, offset = 0 } = req.body;
      const ChatModel = getChatModel(userId);
      const offsetInt = parseInt(offset, 10);
      const chats = await ChatModel.find({}, { _id: 0, title: 1, sessionId: 1 })
        .sort({ updatedAt: -1 }).skip(offsetInt).limit(10);
      res.status(200).json({ success: true, chatList: chats, offset: offsetInt + chats.length });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch chats" });
    }
  },

  renameTitle: async (req, res) => {
    const { sessionId, title, userId } = req.body;
    const ChatModel = getChatModel(userId);
    try {
      await ChatModel.updateOne({ sessionId }, { $set: { userTitle: true, title: title } });
      res.status(200).json({ success: true, title });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update title" });
    }
  },

  deleteChat: async (req, res) => {
    const { userId, sessionId } = req.body;
    const ChatModel = getChatModel(userId);
    try {
      const result = await ChatModel.deleteOne({ sessionId });
      if (result.deletedCount == 0) return res.status(404).json({ success: false, error: "Chat not found" });
      res.status(200).json({ success: true, sessionId });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete" });
    }
  },
};

async function checkServerStatus() {
  try {
    const llm_status = await axios.get(llm_url);
    return llm_status.data;
  } catch (error) {
    return { success: false, response: "Service unavailable.", error: "LLM server down." };
  }
}

async function updateConvo(userId, sessionId, sender, message) {
  const ChatModel = getChatModel(userId);
  try {
    await ChatModel.updateOne(
      { sessionId },
      { $push: { conversation: { sender, message, timestamp: new Date() } } }
    );
    return true;
  } catch (error) {
    return false;
  }
}

async function generate(userId, sessionId, message) {
  try {
    const response = await axios.post(llm_url + "/chat", { prompt: message, userId, sessionId });
    const data = response.data;
    const ChatModel = getChatModel(userId);
    const document = await ChatModel.findOne({ sessionId }, { title: 1, userTitle: 1 });

    const sendData = {
      response: data.response,
      replacementParts: data.replacement_parts,
      carModel: data.car_model,
      title: document.title,
    };

    if (!document.userTitle) {
      await ChatModel.updateOne({ sessionId }, { title: data.title });
      sendData.title = data.title;
    }

    await updateConvo(userId, sessionId, "bot", data.response);
    return { success: true, ...sendData, status: true };
  } catch (error) {
    return { success: false, response: "Error processing request.", status: true };
  }
}

module.exports = chatController;