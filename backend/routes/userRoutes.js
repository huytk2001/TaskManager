import express from "express";
const router = express.Router();
import { admin, protect } from "../middlewares/authMiddleware.js";
import { getAllUsers, getUserById } from "../controllers/userControllers.js";
router.get("/", protect, admin, getAllUsers);
router.get("/:id", protect, getUserById);

export default router;