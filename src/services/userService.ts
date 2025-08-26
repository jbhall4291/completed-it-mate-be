// src/services/userService.ts
import { UserModel } from "../models/User";
import mongoose from "mongoose";
import { validateObjectId } from "../utils/validators";

export const addUserService = async (username: string, email: string) => {

  if (!username || !email) {
    throw new Error("Missing required fields");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailValidation = emailRegex.test(email)

  if (!emailValidation) {
    throw { status: 422, message: "Invalid email address" };
  }

  // don't allow duplicate emails
  const existingEmail = await UserModel.findOne({ email });
  if (existingEmail) {
    throw { status: 400, message: "email already exists on an existing user" };
  }

  // don't allow duplicate usernames
  const existingUsername = await UserModel.findOne({ username });
  if (existingUsername) {
    throw { status: 400, message: "username already exists on an existing user" };
  }

  const newUser = await UserModel.create({ username, email });

  return newUser;
};

export const getUserByIdService = async (userId: string) => {

  // is id valid?
  validateObjectId(userId, "user");

  const user = await UserModel.findById(userId);

  if (!user) {
    throw { status: 404, message: "User not found" }
  }


  return user
}