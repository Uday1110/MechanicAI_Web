const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Middleware to parse JSON request bodies
router.use(express.json());

// Get a product by ID
router.get("/product/:productid", async (req, res) => {
    const id = req.params.productid;
    try {
        const product = await Product.findOne({ _id: id });
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: "Part is not available" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching part", error: err });
    }
});

// Get all products
router.get("/product", async (req, res) => {
    try {
        const allProducts = await Product.find();
        res.status(200).json({ success: true, data: allProducts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a new product
router.post("/products", async (req, res) => {
    const product = req.body;

    if (!product.name || !product.price) {
        return res.status(400).json({ success: false, message: "Please provide all the fields" });
    }

    const newProduct = new Product(product);
    try {
        await newProduct.save();
        res.status(200).json({ success: true, message: "New Product added" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});


// router.post("/product-list", async (req, res) => {
//     try {
//         const { parts } = req.body;

//         if (!Array.isArray(parts) || parts.length === 0) {
//             return res.status(400).json({ message: "Please pass an array of parts" });
//         }

//         const uniqueparts = [...new Set(parts)];
//         const regexQueries = uniqueparts.map(name => ({
//             name: { $regex: name.replace(/\s+/g, '.*'), $options: 'i' }
//         }));

//         const matchingProducts = await Product.find({ $or: regexQueries }, { _id: 1, name: 1, image_url: 1 });
//         const result = matchingProducts.map(prod => ({
//             name: prod.name,
//             id: prod._id,
//             url: `http://localhost:5173/product/${prod._id}`,
//             image: prod.image_url
//         }));

//         res.status(200).json({ success: true, data: result });
//     } catch (err) {
//         res.status(500).json({ success: false, message: "Error fetching product links", error: err.message });
//     }
// });
router.post("/product-list", async (req, res) => {
    try {
        const { parts } = req.body;

        if (!Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ message: "Please pass an array of parts" });
        }

        // Remove empty or invalid strings from the parts array
        const validParts = parts.filter(part => typeof part === "string" && part.trim() !== "");

        if (validParts.length === 0) {
            return res.status(400).json({ message: "Please provide valid part names" });
        }

        const uniqueparts = [...new Set(validParts)];
        const regexQueries = uniqueparts.map(name => ({
            name: { $regex: name.trim().replace(/\s+/g, '.*'), $options: 'i' }
        }));


        const matchingProducts = await Product.find(
            { $or: regexQueries },
            { _id: 1, name: 1, image_url: 1 }
        );

        // Debugging: Show matching products
        // console.log("Matching Products:", matchingProducts);

        // Create a dictionary for quick lookup based on partial name match
        const productMap = matchingProducts.reduce((map, prod) => {
            map[prod.name.toLowerCase().trim()] = {
                name: prod.name,
                id: prod._id,
                url: `http://localhost:5173/product/${prod._id}`,
                image: prod.image_url
            };
            return map;
        }, {});

        // Map over the validParts array to preserve order and do partial matching
        const result = validParts.map(part => {
            const key = part.toLowerCase().trim();  // Lowercase and trim the part name
            
            // Look for partial matches in the product names
            const matchedProduct = matchingProducts.find(prod => 
                prod.name.toLowerCase().includes(key)
            );

            return matchedProduct ? {
                name: matchedProduct.name,
                id: matchedProduct._id,
                url: `http://localhost:5173/product/${matchedProduct._id}`,
                image: matchedProduct.image_url
            } : { name: part, id: null, url: null, image: null };
        });

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching product links", error: err.message });
    }
});

router.post("/parts-list", async (req, res) => {
    try {
        const { parts } = req.body;

        if (!Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ message: "Please pass an array of parts" });
        }

        // Remove empty or invalid strings from the parts array
        const validParts = parts.filter(part => typeof part === "string" && part.trim() !== "");

        if (validParts.length === 0) {
            return res.status(400).json({ message: "Please provide valid part names" });
        }

        const uniqueparts = [...new Set(validParts)];
        const regexQueries = uniqueparts.map(name => ({
            name: { $regex: name.trim().replace(/\s+/g, '.*'), $options: 'i' }
        }));


        const matchingProducts = await Product.find(
            { $or: regexQueries },
            { _id: 1, name: 1, image_url: 1 }
        );

        // Debugging: Show matching products
        // console.log("Matching Products:", matchingProducts);

        // Create a dictionary for quick lookup based on partial name match
        const productMap = matchingProducts.reduce((map, prod) => {
            map[prod.name.toLowerCase().trim()] = {
                name: prod.name,
                // id: prod._id,
                url: `http://localhost:5173/product/${prod._id}`,
                // image: prod.image_url
            };
            return map;
        }, {});

        // Map over the validParts array to preserve order and do partial matching
        const result = validParts.map(part => {
            const key = part.toLowerCase().trim();  // Lowercase and trim the part name
            
            // Look for partial matches in the product names
            const matchedProduct = matchingProducts.find(prod => 
                prod.name.toLowerCase().includes(key)
            );

            return matchedProduct ? {
                name: matchedProduct.name,
                // id: matchedProduct._id,
                url: `/product/${matchedProduct._id}`,
                // image: matchedProduct.image_url
            } : { name: part, id: null, url: null, image: null };
        });

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching product links", error: err.message });
    }
});





// Delete a product
router.delete("/product/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const del = await Product.findOneAndDelete({ _id: id });
        if (del) {
            res.status(200).json({ success: true, message: "Deleted successfully" });
        } else {
            res.status(404).json({ success: false, message: "Product not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting product", error: err });
    }
});

// Update a product stock
router.put("/product/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const update = await Product.findOneAndUpdate(
            { _id: id },
            { $inc: { stock: -1 } },
            { new: true }
        );

        if (update) {
            if (update.stock < 0) {
                await Product.findOneAndUpdate({ _id: id }, { $inc: { stock: 1 } });
                return res.status(400).json({ success: false, message: "Insufficient stock" });
            }

            res.status(200).json({ success: true, message: "Product updated", product: update });
        } else {
            res.status(404).json({ success: false, message: "Product with id not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating product", error: err.message });
    }
});

// Search products using a query
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Please provide a search query" });
        }

        const results = await Product.aggregate([
            {
                $search: {
                    index: 'default',
                    text: {
                        query,
                        path: 'name',
                        fuzzy: { maxEdits: 2, prefixLength: 3 }
                    }
                }
            },
            {
                $project: { _id: 1, name: 1, description: 1, price: 1 }
            }
        ]);

        res.status(results.length > 0 ? 200 : 404).json({
            success: results.length > 0,
            data: results,
            message: results.length > 0 ? undefined : "No products found"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error performing search", error: error.message });
    }
});

module.exports = router;
