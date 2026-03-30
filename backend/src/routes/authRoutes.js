import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

/* ================= MIDDLEWARE ================= */
// Protects routes and attaches user to req.user
const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized - No Token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

/* ================= ROUTES ================= */

// 1. REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, username, password,dob,hobby} = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already exists" });

    const profileImage = `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`;

    const user = new User({
      name,
      email,
      username,
      password,
      profileImage,
      role: "",
      bio: "",
        dob: dob || "",       
  hobby: hobby || "",
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in register:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🔥 3. GET CURRENT USER (ONLY NEW ADDITION)
router.get("/me", protectRoute, async (req, res) => {
  try {
    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        profileImage: req.user.profileImage,
        role: req.user.role,
        bio: req.user.bio,
        dob: req.user.dob,
        hobby: req.user.hobby,
      },
    });
  } catch (error) {
    console.log("Error in /me:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 4. UPDATE PROFILE
router.put("/update-profile", protectRoute, async (req, res) => {
  try {
    const { name, role, bio, profileImage,hobby,dob } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(name && { name }),
          ...(role !== undefined && { role }),
          ...(bio !== undefined && { bio }),
            ...(dob !== undefined && { dob }),        
  ...(hobby !== undefined && { hobby }),
          ...(profileImage && { profileImage }),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile updated",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role,
        bio: updatedUser.bio,
         dob: updatedUser.dob,        
  hobby: updatedUser.hobby,
      },
    });
  } catch (error) {
    console.log("Error in update-profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;