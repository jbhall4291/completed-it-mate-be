// userController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";
import { GameModel } from "../models/Game";
import { addGameToUserService, addUserService, getUserByIdService, removeGameFromUserService } from "../services/userService";


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