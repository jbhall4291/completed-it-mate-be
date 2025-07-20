// userController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";


export const getUsers = async (req: Request, res: Response) => {
  console.log('hit getUsers!!')
  try {
    const users = await UserModel.find();  // Fetch all users
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  console.log('hit getUserById!!')
  
  try {
    const { id } = req.params;  // This is the dynamic :id param

// Validate the ID first to avoid a CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }


    const user = await UserModel.findById(id).populate('gamesOwned.gameId').lean(); 
    // populate() optional — only if you want game details auto-loaded

    

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