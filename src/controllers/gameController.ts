// controllers/gameController.ts
import { Request, Response } from 'express';
import { getAllGamesService, searchGameTitlesService, getGameDetailService, getGamesPagedService, getTopRatedGamesService, getLatestReleasesService } from '../services/gameService';

export const getGames = async (req: Request, res: Response) => {
  try {
    const titleQuery = typeof req.query.titleQuery === 'string' ? req.query.titleQuery : undefined;

    // If no page provided, behave exactly like today (return array)
    const hasPaging = typeof req.query.page !== 'undefined' || typeof req.query.pageSize !== 'undefined';

    // Defaults + clamps
    const page = Math.max(parseInt(String(req.query.page ?? 1), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize ?? 24), 10) || 24, 1), 100);

    const data = await getGamesPagedService({ titleQuery, page, pageSize });

    // Backward-compat: no page param => return just items (array)
    if (!hasPaging) return res.json(data.items);

    // New paged envelope
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching games' });
  }
};


export const getTopRatedGames = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? 5), 10) || 5, 1), 24);
    const items = await getTopRatedGamesService(limit);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching top rated games' });
  }
};

export const getLatestReleases = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? 5), 10) || 5, 1), 24);
    const items = await getLatestReleasesService(limit);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching latest releases' });
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