// userController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/User";

export const getUsers = async (req: Request, res: Response) => {
  console.log('hit getUsers!!')
  try {
    const users = await UserModel.find();  // Fetch all users
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
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