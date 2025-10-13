// controllers/gameController.ts
import { Request, Response } from 'express';
import {
  getGamesPagedService,
  getTopRatedGamesService,
  getLatestReleasesService,
  getGameDetailService,
} from '../services/gameService';
import { GameModel } from '../models/Game';

// --- helpers -----------------------------------------------------------
const parseCSV = (v: unknown) =>
  typeof v === 'string' && v.trim()
    ? Array.from(new Set(v.split(',').map(s => s.trim()).filter(Boolean)))
    : [];

const toIntArray = (arr: string[]) =>
  arr.map(n => parseInt(n, 10)).filter(n => Number.isFinite(n));

const PLATFORM_MAP: Record<string, string> = {
  pc: 'pc',
  playstation: 'playstation',
  xbox: 'xbox',
  switch: 'nintendo', // RAWG parent maps Switch -> nintendo
  nintendo: 'nintendo',
  mac: 'mac',
  linux: 'linux',
  ios: 'ios',
  android: 'android',
  sega: 'sega',
  'commodore-amiga': 'commodore-amiga',
  'neo-geo': 'neo-geo',
};

const normPlatforms = (arr: string[]) =>
  Array.from(
    new Set(arr.map(s => (PLATFORM_MAP[s.toLowerCase().trim()] ?? s.toLowerCase().trim())))
  );

const SORT_MAP: Record<string, any> = {
  'metacritic-desc': { 'metacritic.score': -1, releaseDate: -1, title: 1 },
  'metacritic-asc': { 'metacritic.score': 1, releaseDate: 1, title: 1 },
  'released-desc': { releaseDate: -1, title: 1 },
  'released-asc': { releaseDate: 1, title: 1 },
  'title-asc': { title: 1 },
  'title-desc': { title: -1 },
};

// ----------------------------------------------------------------------

export const getGames = async (req: Request, res: Response) => {
  try {
    // Search (keep legacy ?titleQuery=, allow ?q=)
    const qParam = typeof req.query.q === 'string' ? req.query.q : undefined;
    const titleQuery =
      typeof req.query.titleQuery === 'string' ? req.query.titleQuery : qParam;

    // Optional filters
    const platforms = normPlatforms(parseCSV(req.query.platforms)); // e.g. xbox,pc,switch
    const genres = parseCSV(req.query.genres);                      // e.g. rpg,strategy
    const yearsList = toIntArray(parseCSV(req.query.years));        // e.g. 2001,2003

    const yearMin = Number.isFinite(Number(req.query.yearMin))
      ? Number(req.query.yearMin)
      : undefined;
    const yearMax = Number.isFinite(Number(req.query.yearMax))
      ? Number(req.query.yearMax)
      : undefined;


    const now = new Date();
    const DEFAULT_YEARS_BACK = 10;
    const defaultStart = new Date(now.getFullYear() - DEFAULT_YEARS_BACK, 0, 1);

    // detect if this is the "blank landing" (no filters at all)
    const isBlankLanding =
      !(titleQuery && titleQuery.trim()) &&
      platforms.length === 0 &&
      genres.length === 0 &&
      yearsList.length === 0 &&
      typeof req.query.yearMin === 'undefined' &&
      typeof req.query.yearMax === 'undefined' &&
      typeof req.query.minScore === 'undefined';




    // Build Mongo filter
    const filter: Record<string, any> = {};

    if (titleQuery && titleQuery.trim()) {
      const escaped = titleQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }


    if (platforms.length) {
      filter.parentPlatforms = { $in: platforms };
    }

    if (genres.length) {
      filter.genres = { $in: genres };
    }

    const isNum = (v: unknown): v is number =>
      typeof v === 'number' && Number.isFinite(v);

    if (yearsList.length) {
      filter.releaseDate = { $ne: null };
      filter.$expr = { $in: [{ $year: "$releaseDate" }, yearsList] };
    } else {
      const r: any = {};
      if (isNum(yearMin)) {
        const yMin = Math.trunc(yearMin);
        r.$gte = new Date(yMin, 0, 1);
      }
      if (isNum(yearMax)) {
        const yMax = Math.trunc(yearMax);
        r.$lt = new Date(yMax + 1, 0, 1); // exclusive upper bound
      }
      if (Object.keys(r).length) filter.releaseDate = r;
    }

    if (isBlankLanding) {
      filter.releaseDate = {
        ...(filter.releaseDate ?? {}),
        $gte: defaultStart,
        $lte: now,
      };
    }


    // Back-compat paging behaviour
    const hasPaging =
      typeof req.query.page !== 'undefined' ||
      typeof req.query.pageSize !== 'undefined';

    const page = Math.max(parseInt(String(req.query.page ?? 1), 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(String(req.query.pageSize ?? 24), 10) || 24, 1),
      100
    );

    const sortKey = typeof req.query.sort === 'string'
      ? req.query.sort
      : (isBlankLanding ? 'metacritic-desc' : 'title-asc'); // or keep  previous default
    const sort = SORT_MAP[sortKey] ?? SORT_MAP['metacritic-desc'];

    const data = await getGamesPagedService({ titleQuery, page, pageSize, filter, sort });



    if (!hasPaging) return res.json(data.items); // legacy response

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching games' });
  }
};

export const getTopRatedGames = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? 5), 10) || 5, 1),
      24
    );
    const items = await getTopRatedGamesService(limit);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching top rated games' });
  }
};

export const getLatestReleases = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? 5), 10) || 5, 1),
      24
    );
    const items = await getLatestReleasesService(limit);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching latest releases' });
  }
};

export const getGameDetail = async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const dto = await getGameDetailService(idOrSlug, userId);
    if (!dto) return res.status(404).json({ message: 'Game not found' });
    return res.json(dto);
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ message: err?.message ?? 'Error fetching game' });
  }
};


export const getGameFacets = async (_req: Request, res: Response) => {
  try {
    const [doc] = await GameModel.aggregate([
      {
        $facet: {
          platforms: [
            { $unwind: "$parentPlatforms" },
            { $group: { _id: "$parentPlatforms", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          genres: [
            { $unwind: "$genres" },
            { $group: { _id: "$genres", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          years: [
            { $match: { releaseDate: { $ne: null } } },
            { $project: { y: { $year: "$releaseDate" } } },
            { $group: { _id: null, min: { $min: "$y" }, max: { $max: "$y" } } },
          ],
        },
      },
    ]);

    const platforms = (doc?.platforms ?? []).map((p: any) => ({ value: p._id, count: p.count }));
    const genres = (doc?.genres ?? []).map((g: any) => ({ value: g._id, count: g.count }));
    const yr = (doc?.years ?? [])[0] || { min: null, max: null };

    res.json({ platforms, genres, yearMin: yr.min, yearMax: yr.max });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching facets" });
  }
};
