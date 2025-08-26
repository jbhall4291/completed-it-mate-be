// userController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";
import { GameModel } from "../models/Game";
import { addUserService, getUserByIdService } from "../services/userService";


export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().populate('gameCount').exec();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id)
    res.json(user);
  } catch (error: any) {
    res
      .status(error.status || 400)
      .json({ message: error.message || "Error getting user" });
  }
};



export const createUser = async (req: Request, res: Response) => {
  const { username } = req.body;
  const { email } = req.body;
  try {
    const createUser = await addUserService(username, email)
    res.status(201).json(createUser);
  } catch (error: any) {
    res
      .status(error.status || 400)
      .json({ message: error.message || "Error creating user" });
  }
};



