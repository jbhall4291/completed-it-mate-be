// controllers/gameController.ts
import { Request, Response } from 'express';
import { getAllGamesService, searchGameTitlesService } from '../services/gameService';

export const getGames = async (req: Request, res: Response) => {
  try {
    const titleQuery = typeof req.query.titleQuery === 'string' ? req.query.titleQuery : undefined;
    const items = titleQuery ? await searchGameTitlesService(titleQuery) : await getAllGamesService();
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching games' });
  }
};
