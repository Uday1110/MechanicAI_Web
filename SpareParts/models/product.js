const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  part_id: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate part IDs
  },
  category: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: false,
  },
  compatibility: {
    type: [String], // Array of strings
    required: false,
  },
  stock: {
    type: Number,
    required: true,
    min: 0, // Ensure stock can't go negative
  },
  image_url: {
    type: String,
    required: false,
  },
  date_added: {
    type: Date,
    default: Date.now, // Automatically set the current date if not provided
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
