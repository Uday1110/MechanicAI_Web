const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/nearby-shops", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API Key missing" });
    }

    // 1. Use the NEW Places API endpoint
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    // 2. Define the search criteria in the request body
    const data = {
      includedTypes: ["car_repair"],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
          radius: 5000.0, // 5km
        },
      },
    };

    // 3. The New API REQUIRES a FieldMask header to tell Google which data points you want
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.rating",
      },
    });

    // 4. The New API returns a 'places' array instead of 'results'
    const shops = response.data.places
      ? response.data.places.map((place) => ({
          name: place.displayName?.text || "Unknown Shop",
          vicinity: place.formattedAddress || "No address available",
          rating: place.rating || "N/A",
        }))
      : [];

    res.json({ success: true, results: shops });
  } catch (error) {
    console.error("Google API Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || "Internal Server Error",
    });
  }
});

module.exports = router;
