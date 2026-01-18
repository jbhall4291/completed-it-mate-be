// services/communityService.ts
import { UserModel } from "../models/User";
import { UserGameModel } from "../models/UserGame";

export async function buildCommunityDashboardService() {
    const [
        players,
        gamesInLibraries,
        completedAgg,
        genreAgg,
        mostCompletedGames,
    ] = await Promise.all([
        UserModel.countDocuments(),
        UserGameModel.countDocuments(),
        UserGameModel.aggregate([
            { $match: { status: "completed" } },
            { $count: "count" },
        ]),
        UserGameModel.aggregate([
            {
                $lookup: {
                    from: "games",
                    localField: "gameId",
                    foreignField: "_id",
                    as: "game",
                },
            },
            { $unwind: "$game" },
            { $unwind: "$game.genres" },
            {
                $group: {
                    _id: "$game.genres",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 1 },
        ]),
        UserGameModel.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: "$gameId",
                    completionCount: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "games",
                    localField: "_id",
                    foreignField: "_id",
                    as: "game",
                },
            },
            { $unwind: "$game" },
            {
                $project: {
                    gameId: "$game._id",
                    title: "$game.title",
                    completionCount: 1,
                },
            },
            { $sort: { completionCount: -1, title: 1 } },
            { $limit: 5 },
        ]),
    ]);

    const totalCompletions = completedAgg[0]?.count ?? 0;

    const completionRatePct =
        gamesInLibraries === 0
            ? 0
            : Math.round((totalCompletions / gamesInLibraries) * 100);

    return {
        snapshot: {
            players,
            gamesInLibraries,
            totalCompletions,
            completionRatePct,
            mostPopularGenre: genreAgg[0]
                ? { name: genreAgg[0]._id, count: genreAgg[0].count }
                : null,
        },
        mostCompletedGames,
    };
}
