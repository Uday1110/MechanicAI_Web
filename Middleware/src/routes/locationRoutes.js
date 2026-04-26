const express = require("express");
const router = express.Router();
const axios = require("axios");

/**
 * Reusable helper function to fetch places from Google New Places API
 * This is exported so chatController.js can trigger searches during a chat session.
 */
const fetchPlaces = async (lat, lng, includedTypes) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const url = "https://places.googleapis.com/v1/places:searchNearby";

  const data = {
    includedTypes: includedTypes, // Accepts array like ["gas_station"] or ["police"]
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        },
        radius: 5000.0, // 5km radius
      },
    },
  };

  const response = await axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      // FieldMask is mandatory for the New Places API
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating",
    },
  });

  return response.data.places
    ? response.data.places.map((place) => ({
        name: place.displayName?.text || "Unknown Place",
        vicinity: place.formattedAddress || "No address available",
        rating: place.rating || "N/A",
      }))
    : [];
};

/**
 * Standard GET route for the "Find Nearest Repair Shops" button on the UI
 */
router.get("/nearby-shops", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    // Default to car_repair for this specific endpoint
    const shops = await fetchPlaces(lat, lng, ["car_repair"]);
    res.json({ success: true, results: shops });
  } catch (error) {
    console.error("Google API Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || "Internal Server Error",
    });
  }
});

// Export both the router and the helper function
module.exports = { router, fetchPlaces };