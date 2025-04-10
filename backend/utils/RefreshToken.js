import jwt from "jsonwebtoken";
import UserModel from "../model/User.js";

export const generateRefreshToken = async (userId) => {
  const token = jwt.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // hoặc "7d"
  });
  const updatedToken = await UserModel.findOneAndUpdate(
    {
      _id: userId,
    },
    { refresh_token: token },
    { new: true }
  );
  return token;
};
