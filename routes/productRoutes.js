const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// @route GET /api/products
// @desc Fetch all products with filtering, sorting, and pagination
// @access Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      sort,
      category,
      brand,
      minPrice,
      maxPrice,
      tags,
      skill,
      age,
      activity,
    } = req.query;

    const query = {};

    // Search by name and description (case-insensitive)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const escapeRegex = (text) => {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    // Filter Logic:
    // 1. Across different categories (e.g., Skill AND Age), we use AND logic.
    //    Example: ?skill=A&age=B -> Products must have Skill A AND be for Age B.
    // 2. Within the same category (e.g., multiple skills), we use OR logic ($in).
    //    Example: ?skill=A,B -> Products can have Skill A OR Skill B.
    // This provides a standard e-commerce filtering experience where users can broaden their search within a category but narrow it down by combining different criteria.

    // Filter by Skills
    if (skill) {
      const skillsArray = Array.isArray(skill) ? skill : skill.split(",");
      query.skills = {
        $in: skillsArray.map((s) => new RegExp(escapeRegex(s), "i")),
      };
    }

    // Filter by Ages
    if (age) {
      const agesArray = Array.isArray(age) ? age : age.split(",");
      query.ages = {
        $in: agesArray.map((a) => new RegExp(escapeRegex(a), "i")),
      };
    }

    // Filter by Activities
    if (activity) {
      const activitiesArray = Array.isArray(activity)
        ? activity
        : activity.split(",");
      query.activities = {
        $in: activitiesArray.map((a) => new RegExp(escapeRegex(a), "i")),
      };
    }

    // Sorting
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "name_asc":
          sortOption = { name: 1 };
          break;
        case "name_desc":
          sortOption = { name: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/products/best-seller
// @desc Retrieve the product with highest rating
// @access Public
router.get("/best-seller", async (req, res) => {
  try {
    const bestSeller = await Product.findOne().sort({ rating: -1 });

    if (bestSeller) {
      res.json(bestSeller);
    } else {
      res.status(404).json({ message: "No best seller found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/products/similar/:id
// @desc Retrieve similar products based on the current product's category
// @access Public
router.get("/similar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const similarProducts = await Product.find({
      _id: { $ne: id }, // Exclude the current product ID
      category: product.category,
    }).limit(4);

    res.json(similarProducts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/products/new-arrivals
// @desc Retrieve latest 8 products - Creation date
// @access Public
router.get("/new-arrivals", async (req, res) => {
  try {
    // Fetch latest 8 products
    const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
    res.json(newArrivals);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/products/:id
// @desc Get a single product by ID
// @access Public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product Not Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
