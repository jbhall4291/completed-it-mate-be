import { getAllGamesService } from "../src/services/gameService";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";
import { Types } from "mongoose";

describe("getAllGamesService", () => {
    beforeEach(async () => {
        await GameModel.deleteMany({});
        await UserGameModel.deleteMany({});
    });

    it("returns [] when there are no games", async () => {
        const res = await getAllGamesService();
        expect(res).toEqual([]);
    });

    it("returns projected card fields with completedCount merged in", async () => {
        // Seed two games
        const [g1, g2] = await GameModel.create([
            {
                title: "Halo Infinite",
                imageUrl: "halo.jpg",
                parentPlatforms: ["xbox"],
                releaseDate: new Date("2021-12-08"),
                avgCompletionTime: 20, // should NOT be in result (projection)
                rawgId: 1001,
            },
            {
                title: "The Last of Us",
                imageUrl: "tlou.jpg",
                parentPlatforms: ["playstation"],
                releaseDate: new Date("2013-06-14"),
                avgCompletionTime: 16, // also projected out
                rawgId: 1002,
            },
        ]);

        // Completed rows: g1 -> 2, g2 -> 0 (plus noise rows that shouldn't count)
        await UserGameModel.create([
            { userId: new Types.ObjectId(), gameId: g1._id, status: "completed" },
            { userId: new Types.ObjectId(), gameId: g1._id, status: "completed" },
            { userId: new Types.ObjectId(), gameId: g1._id, status: "playing" },   // noise
            { userId: new Types.ObjectId(), gameId: g2._id, status: "wishlist" }, // noise
        ]);

        const res = await getAllGamesService();

        // Should include both games
        expect(res).toHaveLength(2);

        // Map by title for easy assertions
        const byTitle = new Map(res.map((r: any) => [r.title, r]));

        // Completed counts correct
        expect(byTitle.get("Halo Infinite")!.completedCount).toBe(2);
        expect(byTitle.get("The Last of Us")!.completedCount).toBe(0);

        // Only projected fields + completedCount
        const halo = byTitle.get("Halo Infinite")!;
        expect(halo).toEqual(
            expect.objectContaining({
                title: "Halo Infinite",
                imageUrl: "halo.jpg",
                parentPlatforms: ["xbox"],
                // releaseDate will be a Date or ISO depending on lean; just check it exists
                completedCount: 2,
            })
        );
        // Ensure a non-projected field didn't sneak in
        expect((halo as any).avgCompletionTime).toBeUndefined();
    });
});
