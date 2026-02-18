const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart")
const products = require("./data/products");

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data from all collections to start fresh
    await Cart.deleteMany(); // Reset all carts
    await Product.deleteMany();
    await User.deleteMany();

    const createdUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "123456",
      role: "admin",
    });

    const adminUser = createdUser._id;

    const sampleProducts = products.map((product) => {
      return { ...product, user: adminUser };
    });

    await Product.insertMany(sampleProducts);

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    // Clear existing data including carts
    await Cart.deleteMany(); // Reset all carts
    await Product.deleteMany();
    await User.deleteMany();

    console.log("Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
