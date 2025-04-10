import TaskModel from "../model/Task.js";
import UserModel from "../model/User.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ role: "user" }).select("-password"); // Exclude password field from the response
    // add task counts  to each user
    const userWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pedingTasks = await TaskModel.countDocuments({
          assignedTo: user._id,
          status: "Pending",
        });
        const inProgressTasks = await TaskModel.countDocuments({
          assignedTo: user._id,
          status: "In Progress",
        });
        const completedTasks = await TaskModel.countDocuments({
          assignedTo: user._id,
          status: "Completed",
        });
        return {
          ...user._doc,
          taskCounts: {
            pending: pedingTasks,
            inProgress: inProgressTasks,
            completed: completedTasks,
          },
        };
      })
    );
    res.status(200).json(userWithTaskCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
