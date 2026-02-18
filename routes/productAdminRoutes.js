const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// @route GET /api/admin/products
// @desc Get all products (Admin only)
// @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/admin/products
// @desc Create a new Product
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      productCode,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      skills,
      ages,
      activities,
    } = req.body;

    const product = new Product({
      name,
      productCode,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      skills,
      ages,
      activities,
      user: req.user._id, // Reference to the user creating the product
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route PUT /api/admin/products/:id
// @desc Update an existing product
// @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const {
      name,
      productCode,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      skills,
      ages,
      activities,
    } = req.body;

    // Find product by ID
    const product = await Product.findById(req.params.id);

    if (product) {
      // Update fields
      product.name = name || product.name;
      product.productCode = productCode || product.productCode;
      product.description = description || product.description;
      product.price = price || product.price;
      product.discountPrice = discountPrice || product.discountPrice;
      product.countInStock = countInStock || product.countInStock;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      product.images = images || product.images;
      product.isFeatured =
        isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isPublished =
        isPublished !== undefined ? isPublished : product.isPublished;
      product.tags = tags || product.tags;
      product.dimensions = dimensions || product.dimensions;
      product.weight = weight || product.weight;
      product.skills = skills || product.skills;
      product.ages = ages || product.ages;
      product.activities = activities || product.activities;

      // Save updated product
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route DELETE /api/admin/products/:id
// @desc Delete a product by ID
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
