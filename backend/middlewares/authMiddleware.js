import jwt from "jsonwebtoken";
import UserModel from "../model/User.js";
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = await UserModel.findById(decoded.userId).select("-password");
      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
//Middleware to check if user is admin
export const admin = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(401).json({ message: "Not authorized as an admin" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
