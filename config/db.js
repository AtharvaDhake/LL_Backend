/* config/db.js */
const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If we have a cached connection, use it
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection promise exists, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Turn off buffering so we fail fast if no connection
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log("Details: New MongoDB Connection Established");
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise if it failed so we can retry
    console.error("MongoDB Connection Failed:", e);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
