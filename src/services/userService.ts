import { UserModel } from "../models/User";
import mongoose from "mongoose";
import { validateObjectId } from "../utils/validators";

export const addUserService = async (username: string, email: string) => {
  if (!username || !email) {
    throw new Error("Missing required fields");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValidation = emailRegex.test(email);

  if (!emailValidation) {
    throw { status: 422, message: "Invalid email address" };
  }

  // don't allow duplicate emails
  const existingEmail = await UserModel.findOne({ email });
  if (existingEmail) {
    throw { status: 400, message: "email already exists on an existing user" };
  }

  // don't allow duplicate usernames
  const existingUsername = await UserModel.findOne({ usernameLower: username.toLowerCase() });
  if (existingUsername) {
    throw { status: 400, message: "username already exists on an existing user" };
  }

  const newUser = await UserModel.create({
    username,
    usernameLower: username.toLowerCase(),
    email,
    role: "user",
  });

  return newUser;
};

export const getUserByIdService = async (userId: string) => {
  validateObjectId(userId, "user");
  const user = await UserModel.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  return user;
};


// get or create anonymous user by deviceId
export const getOrCreateAnonByDeviceId = async (deviceId: string) => {
  if (!deviceId) throw { status: 400, message: "deviceId required" };
  const now = new Date();
  const user = await UserModel.findOneAndUpdate(
    { deviceId },
    {
      $setOnInsert: { deviceId, role: "anon", createdAt: now }, // ← include deviceId here
      $set: { lastSeenAt: now },
    },
    { upsert: true, new: true }
  );
  return user;
};

// update username (for anon or regular users)
export const updateUsernameService = async (userId: string, username: string) => {
  validateObjectId(userId, "user");

  const clean = username.trim();
  if (clean.length < 3 || clean.length > 20) {
    throw { status: 400, message: "Username must be 3–20 characters" };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
    throw {
      status: 400,
      message: "Only letters, numbers, dot, underscore, and hyphen allowed",
    };
  }

  const lower = clean.toLowerCase();

  const existing = await UserModel.findOne({
    usernameLower: lower,
    _id: { $ne: new mongoose.Types.ObjectId(userId) },
  }).select("_id");
  if (existing) {
    throw { status: 409, message: "Username already taken" };
  }

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { username: clean, usernameLower: lower } },
    { new: true }
  );

  if (!updated) {
    throw { status: 404, message: "User not found" };
  }

  return updated;
};


//Helper: safe user object for responses

export const toSafeUser = (user: any) => ({
  userId: user._id?.toString(),
  username: user.username ?? null,
});
