/* server.js */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db"); // Import the improved connector

// Import Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const subscribeRoutes = require("./routes/subscribeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productAdminRoutes = require("./routes/productAdminRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");

const app = express();

dotenv.config();

app.use(express.json());
app.use(cors());

// --- CRITICAL FIX: Database Connection Middleware ---
// This ensures that every request waits for a DB connection before proceeding.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed in middleware:", error);
    res.status(500).json({ message: "Database Connection Error" });
  }
});
// ----------------------------------------------------

// Middleware to handle JSON syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next();
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to Learning Lounge API");
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", subscribeRoutes);

// Admin Routes
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// Start the server (Local Development check)
if (require.main === module) {
  // For local dev, we connect explicitly once
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  });
}

// Export the app for Vercel
module.exports = app;
