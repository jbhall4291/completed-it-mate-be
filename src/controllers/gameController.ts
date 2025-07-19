// gameController.ts
import { Request, Response } from "express";
import { GameModel } from "../models/Game";

export const getGames = async (req: Request, res: Response) => {
  console.log('hit getGames!!')
  try {
    const games = await GameModel.find();  // Fetch all games
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: "Error fetching games", error });
  }
};
