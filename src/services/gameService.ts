// services/gameService.ts
import { Types } from 'mongoose';
import { GameModel } from '../models/Game';
import { UserGameModel } from '../models/UserGame';
import { isValidObjectId } from 'mongoose';


// Stable card projection (what your cards actually need)
const CARD_FIELDS = 'title imageUrl parentPlatforms releaseDate';

// Escape regex metacharacters safely
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

type BrowseFilterInput =
    | string                                                    // backward-compat: titleQuery
    | {
        q?: string;                                            // fuzzy title
        platforms?: string[];                                  // e.g. ['pc','ps5']
        genres?: string[];                                     // e.g. ['rpg','strategy']
        years?: number[];                                      // explicit years (takes precedence over range)
        yearMin?: number;                                      // range lower
        yearMax?: number;                                      // range upper
    }
    | undefined;

const PLATFORM_MAP: Record<string, string> = {
    pc: 'pc',
    playstation: 'playstation',
    xbox: 'xbox',
    switch: 'nintendo',          // RAWG parent = "nintendo"
    nintendo: 'nintendo',
    mac: 'mac',
    linux: 'linux',
    ios: 'ios',
    android: 'android',
    sega: 'sega',
    'commodore-amiga': 'commodore-amiga',
    'neo-geo': 'neo-geo',
};

function normPlatforms(arr: string[] = []) {
    return Array.from(
        new Set(
            arr
                .map(s => s.toLowerCase().trim())
                .map(s => PLATFORM_MAP[s] ?? s)
                .filter(Boolean)
        )
    );
}

function buildFilter(input?: BrowseFilterInput) {
    // Old behaviour: string means "title contains"
    if (typeof input === 'string') {
        const q = input.trim();
        if (!q) return {};
        return { title: { $regex: new RegExp(esc(q), 'i') } };
    }

    // New object input
    const filter: Record<string, any> = {};
    if (!input) return filter;

    const { q, platforms = [], genres = [], years = [], yearMin, yearMax } = input;

    if (q && q.trim()) {
        filter.title = { $regex: new RegExp(esc(q.trim()), 'i') };
    }

    if (platforms?.length) {
        const vals = normPlatforms(platforms);
        if (vals.length) filter.parentPlatforms = { $in: vals };
    }

    if (genres.length) {
        filter.genres = { $in: genres };
    }

    if (years.length) {
        filter.releasedYear = { $in: years };
    } else if (
        (typeof yearMin === 'number' && Number.isFinite(yearMin)) ||
        (typeof yearMax === 'number' && Number.isFinite(yearMax))
    ) {
        const r: any = {};
        if (typeof yearMin === 'number' && Number.isFinite(yearMin)) r.$gte = yearMin;
        if (typeof yearMax === 'number' && Number.isFinite(yearMax)) r.$lte = yearMax;
        if (Object.keys(r).length) filter.releasedYear = r;
    }

    return filter;
}


// --- shared helpers ---------------------------------------------------------

async function fetchGames(filter: Record<string, any> = {}) {
    return GameModel.find(filter)
        .select(CARD_FIELDS)
        .lean({ virtuals: true });
}

async function attachCompletedCounts<T extends { _id: any }>(games: T[]) {
    if (games.length === 0) {
        return [] as Array<T & { completedCount: number }>;
    }

    const ids = games.map(g => new Types.ObjectId(g._id));
    const rows = await UserGameModel.aggregate([
        { $match: { gameId: { $in: ids }, status: 'completed' } },
        { $group: { _id: '$gameId', count: { $sum: 1 } } },
    ]);
    const map = new Map<string, number>(rows.map(r => [String(r._id), r.count as number]));
    return games.map(g => ({ ...g, completedCount: map.get(String(g._id)) ?? 0 }));
}

// --- public services --------------------------------------------------------

/** Return all games (for now; you can add pagination later) with completedCount attached. */
export async function getAllGamesService() {
    const games = await fetchGames();
    return attachCompletedCounts(games);
}

/** Fuzzy search by title (case-insensitive regex) with completedCount attached. */
export async function searchGameTitlesService(titleQuery?: string) {
    const q = (titleQuery ?? '').trim();
    if (!q) return [];
    const filter = { title: { $regex: new RegExp(esc(q), 'i') } };

    const games = await fetchGames(filter);
    return attachCompletedCounts(games);
}

export async function getTopRatedGamesService(limit = 5) {
    const games = await GameModel.find({ 'metacritic.score': { $ne: null } })
        .select('title imageUrl parentPlatforms releaseDate slug metacritic.score')
        .sort({ 'metacritic.score': -1, title: 1 })
        .limit(limit)
        .lean({ virtuals: true });

    return attachCompletedCounts(games);
}

/** Latest released titles up to now (future-dated excluded). */
export async function getLatestReleasesService(limit = 5) {
    const now = new Date();

    // 🚫 exclude PC to avoid Steam shovelware for now
    const exclude = ['pc', 'mac', 'linux', 'web', 'android']; // expand later if needed: ['pc','mac','linux']
    const games = await GameModel.find({
        releaseDate: { $ne: null, $lte: now },
        parentPlatforms: { $nin: exclude },
    })
        .select('title imageUrl parentPlatforms releaseDate slug metacritic.score')
        .sort({ releaseDate: -1, title: 1 })
        .limit(limit)
        .lean({ virtuals: true });

    return attachCompletedCounts(games);
}

// services/gameService.ts
export async function getGameDetailService(idOrSlug: string, userId?: string) {
    const query = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
        ? { _id: idOrSlug }
        : { slug: idOrSlug };

    const game = await GameModel.findOne(query).lean();
    if (!game) return null;

    const [completedCount, userRel] = await Promise.all([
        UserGameModel.countDocuments({ gameId: game._id, status: 'completed' }),
        userId ? UserGameModel.findOne({ userId, gameId: game._id }).lean() : null,
    ]);

    return {
        _id: String(game._id),
        title: game.title,
        imageUrl: game.imageUrl ?? null,
        parentPlatforms: game.parentPlatforms ?? [],
        releaseDate: game.releaseDate ? game.releaseDate.toISOString() : null,
        avgCompletionTime: game.avgCompletionTime ?? 0,
        genres: game.genres ?? [],
        developers: game.developers ?? [],
        publishers: game.publishers ?? [],
        description: game.description ?? '',
        screenshots: game.screenshots ?? [],
        storeLinks: game.storeLinks ?? [],
        metacritic: game.metacritic ?? null,
        completedCount,
        // 👇 per-user
        userStatus: userRel?.status,
        userGameId: userRel?._id ? String(userRel._id) : undefined,
    };
}


export async function getGamesPagedService({
    titleQuery,
    page,
    pageSize,
    filter,
    sort,
}: {
    titleQuery?: string;
    page: number;
    pageSize: number;
    filter?: Record<string, any>;
    sort?: Record<string, 1 | -1>;
}): Promise<Paged<any>> {
    // Prefer explicit filter (from controller) if provided, else fall back to titleQuery-only
    const effectiveFilter = (filter && Object.keys(filter).length ? filter : buildFilter(titleQuery)) ?? {};
    const effectiveSort = sort ?? { 'metacritic.score': -1, releaseDate: -1, title: 1 };

    const skip = (page - 1) * pageSize;

    const [itemsRaw, total] = await Promise.all([
        GameModel.find(effectiveFilter)
            .select(CARD_FIELDS)
            .sort(effectiveSort)                 // <-- sorting applied here
            .collation({ locale: 'en', strength: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean({ virtuals: true }),
        GameModel.countDocuments(effectiveFilter),
    ]);

    const items = await attachCompletedCounts(itemsRaw);
    return { items, total, page, pageSize };
}

/* istanbul ignore next: exported for unit tests only */
export { buildFilter, normPlatforms, attachCompletedCounts };