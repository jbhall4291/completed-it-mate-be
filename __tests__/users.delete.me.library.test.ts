import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";

describe("DELETE /api/users/me/library", () => {
    let userId: string;

    beforeEach(async () => {
        const user = await UserModel.create({
            username: "reset-user",
            email: "reset@example.com",
        });

        userId = user._id.toString();

        const game1 = await GameModel.create({
            title: "Halo Infinite",
            parentPlatforms: ["Xbox"],
            releaseDate: "2021-12-08",
            avgCompletionTime: 20,
            rawgId: 1001,
        });

        const game2 = await GameModel.create({
            title: "Forza Horizon 5",
            parentPlatforms: ["Xbox"],
            releaseDate: "2021-11-09",
            avgCompletionTime: 30,
            rawgId: 1002,
        });

        await UserGameModel.create([
            { userId: user._id, gameId: game1._id, status: "owned" },
            { userId: user._id, gameId: game2._id, status: "completed" },
        ]);
    });

    it("removes all games from the user's library and returns 204", async () => {
        const before = await UserGameModel.countDocuments({ userId });
        expect(before).toBe(2);

        const res = await request(app)
            .delete("/api/users/me/library")
            .set("x-user-id", userId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(204);

        const after = await UserGameModel.countDocuments({ userId });
        expect(after).toBe(0);
    });

    it("returns 204 even if the user's library is already empty", async () => {
        await UserGameModel.deleteMany({ userId });

        const res = await request(app)
            .delete("/api/users/me/library")
            .set("x-user-id", userId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(204);
    });

    it("401 if x-user-id header is missing", async () => {
        const res = await request(app)
            .delete("/api/users/me/library")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(401);
    });
});
