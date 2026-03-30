import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import folderRoutes from "./routes/folder.js"; // ✅ ADD

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/folders", folderRoutes); // ✅ ADD

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://10.0.2.2:${PORT}`);
  connectDB();
});