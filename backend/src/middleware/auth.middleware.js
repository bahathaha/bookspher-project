import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
  try {
    // 1. Get the header safely
    const authHeader = req.header("Authorization");

    // 2. Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "No authentication token, access denied" 
      });
    }

    // 3. Extract the actual token
    const token = authHeader.replace("Bearer ", "");

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Find user and attach to request
    // Note: Use 'userId' because that is what you defined in generateToken
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "User not found or token invalid" });
    }

    // Attach user to the request object so routes can use req.user._id
    req.user = user;
    
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    
    // Handle specific JWT errors for clearer debugging
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRoute;