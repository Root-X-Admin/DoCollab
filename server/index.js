import dotenv from "dotenv";
dotenv.config();

// Now load all other modules
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import collabRoutes from "./src/routes/collabRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "DoCollab API is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/collab", collabRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Allowed client: ${CLIENT_URL}`);
  } catch (err) {
    console.error("❌ Failed to connect DB:", err.message);
  }
});
