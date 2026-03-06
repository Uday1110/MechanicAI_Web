const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { connectDB } = require("./config/db");
const productRoutes = require("./Routes/sparepartsroutes");
const path = require("path");

const app = express();
const port = 5001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", productRoutes);

app.use(express.static(path.join(__dirname, "Frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend/dist", "index.html"));
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at port ${port}`);
});
