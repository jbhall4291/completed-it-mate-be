//libraryService.ts
import { UserModel } from "../models/User";
import { GameModel } from "../models/Game";
import { UserGameModel } from "../models/UserGame";
import { validateObjectId } from "../utils/validators";
import { GameStatus } from "../constants/gameStatus";
import { Types } from 'mongoose';

export async function addToLibraryService(userId: string, gameId: string, status: string) {
    // Validate IDs
    validateObjectId(userId, "user");
    validateObjectId(gameId, "game");

    // Ensure user exists
    const user = await UserModel.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    // Ensure game exists
    const game = await GameModel.findById(gameId);
    if (!game) throw { status: 404, message: "Game not found" };

    // Create relationship
    return await UserGameModel.create({ userId, gameId, status });
}


export async function listLibraryService(userId: string) {
    // Validate IDs
    validateObjectId(userId, "user");

    // Ensure user exists
    const user = await UserModel.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    // Keep your populate + projection
    const items = await UserGameModel.find({ userId })
        .populate({
            path: "gameId",
            select: "title imageUrl parentPlatforms releaseDate avgCompletionTime",
        })
        .lean();

    const gameIds = items
        .map(i => (i as any).gameId?._id)
        .filter(Boolean)
        .map(id => new Types.ObjectId(id as string));

    if (gameIds.length) {
        const rows = await UserGameModel.aggregate([
            { $match: { gameId: { $in: gameIds }, status: "completed" } },
            { $group: { _id: "$gameId", count: { $sum: 1 } } },
        ]);
        const byId = new Map<string, number>(rows.map(r => [String(r._id), r.count as number]));

        for (const i of items) {
            if ((i as any).gameId) {
                (i as any).gameId.completedCount =
                    byId.get(String((i as any).gameId._id)) ?? 0;
            }
        }
    }

    return items;
}

export async function removeFromLibraryService(userGameId: string) {

    validateObjectId(userGameId, "userGame");
    const deleted = await UserGameModel.findByIdAndDelete(userGameId);
    if (!deleted) throw { status: 404, message: "Library item not found" };

}


export async function updateUserGameStatusService(
    userGameId: string,
    status: GameStatus
) {
    validateObjectId(userGameId, "userGame");

    const updatedUserGame = await UserGameModel.findByIdAndUpdate(
        userGameId,
        { $set: { status } },
        { new: true, runValidators: true, lean: true }
    );

    if (!updatedUserGame) throw { status: 404, message: "Library item not found" };
    return updatedUserGame
}

