//libraryService.ts
import { UserModel } from "../models/User";
import { GameModel } from "../models/Game";
import { UserGameModel } from "../models/UserGame";
import { validateObjectId } from "../utils/validators";

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



    const items = await UserGameModel.find({ userId })
        .populate({
            path: "gameId",
            select: "title platform releaseDate avgCompletionTime",
        })
        .lean();

    return items;
}

export async function removeFromLibraryService(userGameId: string) {

    validateObjectId(userGameId, "userGame");
    const deleted = await UserGameModel.findByIdAndDelete(userGameId);
    if (!deleted) throw { status: 404, message: "Library item not found" };

}
