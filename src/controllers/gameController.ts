// controllers/gameController.ts
import { Request, Response } from 'express';
import { getAllGamesService, searchGameTitlesService, getGameDetailService } from '../services/gameService';

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

// need route for full details on a specific game, for game detail page
export const getGameDetail = async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params; // make sure your route uses :idOrSlug
    const userId =
      typeof req.query.userId === 'string' ? req.query.userId : undefined;

    const dto = await getGameDetailService(idOrSlug, userId);
    if (!dto) return res.status(404).json({ message: 'Game not found' });
    return res.json(dto);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err?.message ?? 'Error fetching game' });
  }
};