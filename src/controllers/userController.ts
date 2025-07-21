// userController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";
import { GameModel } from "../models/Game";
import { addGameToUserService, removeGameFromUserService } from "../services/userService";


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

  try {
      const updatedUser = await addGameToUserService(id, gameId);
      res.status(200).json(updatedUser);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Server error" });
    }
};


export const removeGameFromUser = async (req: Request, res: Response) => {
  const { id } = req.params;   
  const { gameId } = req.body; 

  try {
      const updatedUser = await removeGameFromUserService(id, gameId);
      res.status(200).json(updatedUser);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Server error" });
    }
};