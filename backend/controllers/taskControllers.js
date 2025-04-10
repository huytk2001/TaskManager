//@route GET /api/tasks
//@desc Get all tasks
//@access Private
import { json } from "express";
import TaskModel from "../model/Task.js";
export const getTasks = async(req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) {
            filter = { status };
        }

        let tasks;
        if (req.user.role === "admin") {
            tasks = await TaskModel.find(filter).populate("assignedTo", "name email");
        } else {
            tasks = await TaskModel.find({
                ...filter,
                assignedTo: req.user._id,
            }).populate("assignedTo", "name email");
        }

        // Thêm completed task count vào từng task
        tasks = await Promise.all(
            tasks.map(async(task) => {
                const completedtask = task.todoCheckList.filter(
                    (item) => item.completed
                ).length;
                return {...task._doc, completedTodoCount: completedtask };
            })
        );

        // Tổng số lượng theo từng status
        const allTasksCount = await TaskModel.countDocuments(
            req.user.role === "admin" ? {} : { assignedTo: req.user._id }
        );

        const pendingTasks = await TaskModel.countDocuments({
            ...filter,
            status: "Pending",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
        });

        const inProgressTasks = await TaskModel.countDocuments({
            ...filter,
            status: "in Progress",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
        });

        const completedTasks = await TaskModel.countDocuments({
            ...filter,
            status: "Completed",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
        });

        res.status(200).json({
            tasks,
            statusSumary: {
                all: allTasksCount,
                pending: pendingTasks,
                inProgress: inProgressTasks,
                completed: completedTasks,
            },
        });
    } catch (error) {
        console.error("getTasks error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

//@Route Post /api/tasks/
export const createTask = async(req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate, // <-- Đúng tên
            assignedTo,
            attachments,
            todoCheckList,
        } = req.body;

        // Kiểm tra nếu assignedTo không phải là mảng
        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo should be an array" });
        }

        // Lưu từng task cho mỗi user trong assignedTo

        const task = await TaskModel.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id, // Gắn người tạo task (admin)
            attachments,
            todoCheckList,
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
//@route PUT /api/tasks/:id
//@desc Get a task by id
export const getTaskById = async(req, res) => {
    try {
        const task = await TaskModel.findById(req.params.id).populate(
            "assignedTo",
            "name email"
        );
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.status(200).json(task);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};
//@Route patch /api/tasks/:id
export const updateTask = async(req, res) => {
    try {
        const task = await TaskModel.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoCheckList = req.body.todoCheckList || task.todoCheckList;
        task.attachments = req.body.attachments || task.attachments;
        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res
                    .status(400)
                    .json({ message: "AssignedTo should be an array" });
            }
        }
        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};
//@Route DELETE /api/tasks/:id
export const deleteTask = async(req, res) => {
    try {
        const task = await TaskModel.findById(req.params.id); // Tìm task theo ID
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        await task.deleteOne();
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Delete Task Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
//@Route Patch /api/tasks/:id/status

export const updateTaskStatus = async(req, res) => {
    try {
        const task = await TaskModel.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        if (!isAssigned && req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "You are not assigned to this task" });
        }
        task.status = req.body.status || task.status;
        if (task.status === "Completed") {
            task.todoCheckList.forEach((item) => (item.completed = true));
            task.progress = 100;
        }
        await task.save();
        res.status(200).json({ message: "Task status updated successfully", task });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

//@Route PATCH /api/tasks/:id/todoCheckList/
export const updateTodoCheckList = async(req, res) => {
    try {
        const { todoCheckList } = req.body;
        const task = await TaskModel.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "You are not assigned to this task" });
        }
        task.todoCheckList = todoCheckList || task.todoCheckList;
        const completedCount = task.todoCheckList.filter(
            (item) => item.completed
        ).length;
        const totalItems = task.todoCheckList.length;
        task.progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
        if (task.progress === 100) {
            task.status = "Completed";
        } else if (task.progress > 0) {
            task.status = "In Progress";
        } else {
            task.status = "Pending";
        }
        await task.save();
        const updatedTask = await TaskModel.findById(req.params.id).populate(
            "assignedTo",
            "name email"
        );
        res.status(200).json({
            message: "Todo checklist updated successfully",
            updatedTask,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

//@Route PATCH /api/tasks/dashboard-data

export const getDashboardData = async(req, res) => {
    try {
        // Lấy tất cả các task
        const totalTask = await TaskModel.countDocuments();
        const pendingTask = await TaskModel.countDocuments({
            status: "Pending",
        });
        const inProgressTasks = await TaskModel.countDocuments({
            status: "In Progress",
        });
        const completedTasks = await TaskModel.countDocuments({
            status: "Completed",
        });
        // Task quá hạn
        const overDueTasks = await TaskModel.countDocuments({
            dueDate: { $lt: new Date() },
            status: { $ne: "Completed" },
        });
        // Lấy tổng số lượng task theo từng người dùng
        const taskStatus = ["Pending", "In Progress", "Completed"];
        const taskCountByUser = await TaskModel.aggregate([{
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        }, ]);
        const taskCountByUserMap = taskCountByUser.reduce((acc, status) => {
            const formattedKey = status._id.replace(/\s/g, "").toLowerCase(); // ví dụ: "In Progress" => "inprogress"
            acc[formattedKey] = status.count || 0;
            return acc;
        }, {});
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};