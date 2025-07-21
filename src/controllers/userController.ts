// userController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";
import { GameModel } from "../models/Game";


export const getUsers = async (req: Request, res: Response) => {
  console.log('hit getUsers!!')
  try {
    const users = await UserModel.find(); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  console.log('hit getUserById!!')
  
  try {
    const { id } = req.params; 

// Validate the ID first to avoid a CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }


    const user = await UserModel.findById(id).populate('gamesOwned.gameId').lean(); 
  

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

// Flatten gamesOwned so the UI doesn’t need to access .gameId
    user.gamesOwned = user.gamesOwned.map((entry: any) => ({
      status: entry.status,
      ...entry.gameId, // spreads all Game fields into the object
    }));

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};



export const createUser = async (req: Request, res: Response) => {
  console.log('hit createUser!!')
  try {
    const { username, email } = req.body;
    const newUser = await UserModel.create({ username, email, gamesOwned: [] });
  res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
};

export const addGameToUser = async (req: Request, res: Response) => {
  const { id } = req.params;   
  const { gameId } = req.body; 


  // check user id is valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user Id" });
  }

  // Fetch the user document
  const user = await UserModel.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }


  // check game id is valid
  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return res.status(400).json({ message: "Invalid game Id" });
  }

  // Fetch the game document
  const game = await GameModel.findById(gameId);
  if (!game) {
    return res.status(404).json({ message: "Game not found" });
  }


  for (const ownedGame of user.gamesOwned) {
      if (ownedGame.gameId.toString() === gameId) return res.status(400).json({ message: "Game already owned" });
  }

  // Add the game to users collection
  user.gamesOwned.push({ gameId, status: "not started" });
  await user.save();

  await user.populate("gamesOwned.gameId");

// Transform so gamesOwned is simplified
const cleanUser = {
  ...user.toObject(),
  gamesOwned: user.gamesOwned.map((entry: any) => ({
    gameId: entry.gameId._id.toString(),  // flatten back to ID
    status: entry.status,
  })),
};


  res.status(200).json(cleanUser);
};