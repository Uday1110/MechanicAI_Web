import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

class ChatAPI {
  static async createSession(userId, message) {
    try {
      const response = await axios.post(`${API_BASE_URL}/new`, {
        userId,
        message,
      });
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static async addMessage(userId, sessionId, message) {
    try {
      const response = await axios.post(`${API_BASE_URL}/message`, {
        userId,
        sessionId,
        message,
      });
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static async getHistory(userId, sessionId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/history`, {
        userId,
        sessionId,
      });
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static async getChats(userId, offset = 0) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chats`, {
        userId,
        offset,
      });
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static async renameTitle(userId, sessionId, title) {
    try {
      const response = await axios.post(`${API_BASE_URL}/title`, {
        userId,
        sessionId,
        title,
      });
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static async deleteChat(userId, sessionId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/delete`, {
        userId,
        sessionId,
      });
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static async addMessage(userId, sessionId, message, lat, lng) { // Add lat, lng params
  try {
    const response = await axios.post(`${API_BASE_URL}/message`, {
      userId,
      sessionId,
      message,
      lat, // Add to body
      lng  // Add to body
    });
    return response.data;
  } catch (error) {
    return ChatAPI.handleError(error);
  }
}

  // This is the new method we added for the Location feature
  static async fetchNearbyShops(lat, lng) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/location/nearby-shops`,
        {
          params: { lat, lng },
        },
      );
      return response.data;
    } catch (error) {
      return ChatAPI.handleError(error);
    }
  }

  static handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 503:
          return {
            success: false,
            error: "LLM server is down. Please try again later.",
          };
        case 500:
          return {
            success: false,
            error: "Server error. Please try again",
          };
        default:
          return {
            success: false,
            error: data?.error || "An unknown error occurred.",
          };
      }
    } else if (error.request) {
      return {
        success: false,
        error: "No response from server. Please check your network connection.",
      };
    } else {
      return { success: false, error: `Request error: ${error.message}` };
    }
  }
}

export default ChatAPI;
