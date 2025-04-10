import express from "express";
import { protect, admin } from "../middlewares/authMiddleware.js";
import {
    createTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateTask,
    updateTaskStatus,
    updateTodoCheckList,
} from "../controllers/taskControllers.js";
const router = express.Router();

router.post("/", protect, admin, createTask);
router.get("/", protect, admin, getTasks);
router.get("/:id", protect, getTaskById);
router.patch("/:id", protect, updateTask);
router.delete("/:id", protect, admin, deleteTask);
router.patch("/:id/status", protect, admin, updateTaskStatus); // Assuming you want to assign a task to a user
router.patch("/:id/todoCheckList", protect, admin, updateTodoCheckList); // Assuming you want to assign a task to a user

export default router;