// services/gameService.ts
import { Types } from 'mongoose';
import { GameModel } from '../models/Game';
import { UserGameModel } from '../models/UserGame';
import { isValidObjectId } from 'mongoose';

// Stable card projection (what your cards actually need)
const CARD_FIELDS = 'title imageUrl parentPlatforms releaseDate';

// Escape regex metacharacters safely
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// --- shared helpers ---------------------------------------------------------

async function fetchGames(filter: Record<string, any> = {}) {
    return GameModel.find(filter)
        .select(CARD_FIELDS)
        .lean({ virtuals: true });
}

async function attachCompletedCounts<T extends { _id: any }>(games: T[]) {
    if (games.length === 0) return games.map(g => ({ ...g, completedCount: 0 }));

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
