import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import ChatMessage from "../models/ChatMessage.js";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const oldMessages = await ChatMessage.find({
      mediaUrl: { $ne: null },
      cloudinaryId: { $ne: null },
      createdAt: { $lt: sevenDaysAgo },
    });

    console.log(`Found ${oldMessages.length} messages to clean up.`);

    for (const msg of oldMessages) {
      try {
        console.log(`Deleting Cloudinary asset ${msg.cloudinaryId}...`);
        await cloudinary.uploader.destroy(msg.cloudinaryId, {
          resource_type: "auto",
        });

        msg.mediaUrl = null;
        msg.cloudinaryId = null;
        // type can stay "image"/"video"/"file" if you want; or set to "file"
        await msg.save();
      } catch (err) {
        console.error(
          `Failed to delete ${msg.cloudinaryId}:`,
          err?.message || err
        );
      }
    }

    console.log("Cleanup complete.");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err.message);
    process.exit(1);
  }
};

run();
