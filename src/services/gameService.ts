// services/gameService.ts
import { GameModel } from "../models/Game";

export async function searchGameTitlesService(titleQuery?: string) {

    const q = (titleQuery ?? "").trim();
    if (!q) return [];

    // escape regex metacharacters in user input
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    return GameModel.find(
        { title: regex },
        // projection (optional): only send whats needed to the client
        { title: 1, platform: 1, releaseDate: 1, avgCompletionTime: 1, rawgId: 1 }
    )
        .sort({ title: 1 })        // tweak as needed (e.g., popularity etc)        
        .lean();
}
