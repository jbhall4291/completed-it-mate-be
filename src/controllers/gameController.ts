// gameController.ts
import { Request, Response } from "express";
import { GameModel } from "../models/Game";
import { searchGameTitlesService } from "../services/gameService";


export const getGames = async (req: Request, res: Response) => {
  try {
    const titleQuery = String(req.query.titleQuery ?? "").trim();

    if (titleQuery) {
      const games = await searchGameTitlesService(titleQuery);
      return res.json(games);
    }

    const games = await GameModel.find().lean();
    return res.json(games);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching games" });
  }
};
