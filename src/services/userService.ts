// src/services/userService.ts
import { UserModel } from "../models/User";
import { GameModel } from "../models/Game";
import mongoose from "mongoose";
import { validateObjectId } from "../utils/validators";

export const addGameToUserService = async (userId: string, gameId: string) => {

  // Validate IDs
  validateObjectId(userId, "user");
  validateObjectId(gameId, "game");

  // Find user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  // Find game
  const game = await GameModel.findById(gameId);
  if (!game) {
    throw { status: 404, message: "Game not found" };
  }

  // Check for duplicates
  if (user.gamesOwned.some((g) => g.gameId.toString() === gameId)) {
    throw { status: 400, message: "Game already owned" };
  }

  // Add game
  const formattedGameId = new mongoose.Types.ObjectId(gameId);

  user.gamesOwned.push({ gameId: formattedGameId, status: "not started" });
  await user.save();

  await user.populate("gamesOwned.gameId");

  // Return simplified data
  return {
    ...user.toObject(),
    gamesOwned: user.gamesOwned.map((entry: any) => ({
      gameId: entry.gameId._id.toString(),
      status: entry.status,
    })),
  };
};


export const removeGameFromUserService = async (userId: string, gameId: string) => {

  // Validate IDs
  validateObjectId(userId, "user");
  validateObjectId(gameId, "game");

  // Find user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  // Find game
  const game = await GameModel.findById(gameId);
  if (!game) {
    throw { status: 404, message: "Game not found" };
  }


  // Remove game
  const formattedGameId = new mongoose.Types.ObjectId(gameId);

  // check if it is actually present
  const ownsGame = user.gamesOwned.some(
    (g) => g.gameId.toString() === formattedGameId.toString()
  );

  if (!ownsGame) {
    throw { status: 404, message: "Game not owned" };
  }

  // it must exist at this point, so remove it
  user.gamesOwned = user.gamesOwned.filter(
    (game) => game.gameId.toString() !== gameId
  );


  await user.save();
  await user.populate("gamesOwned.gameId");

  // Return simplified data
  return {
    ...user.toObject(),
    gamesOwned: user.gamesOwned.map((entry: any) => ({
      gameId: entry.gameId._id.toString(),
      status: entry.status,
    })),
  };
};


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

  const newUser = await UserModel.create({ username, email, gamesOwned: [] });

  return newUser;
};

export const getUserByIdService = async (userId: string) => {

  // is id valid?
  validateObjectId(userId, "user");

  const user = await UserModel.findById(userId).populate('gamesOwned.gameId').lean();

  if (!user) {
    throw { status: 404, message: "User not found" }
  }

  // Flatten gamesOwned so the UI doesn’t need to access .gameId
  user.gamesOwned = user.gamesOwned.map((entry: any) => ({
    status: entry.status,
    ...entry.gameId,
  }));

  return user
}