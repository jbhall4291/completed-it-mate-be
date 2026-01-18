import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";
import * as communityService from "../src/services/communityService";

describe("GET /api/community/dashboard", () => {

    let gameAId: string;
    let gameBId: string;

    beforeEach(async () => {
        // Clean slate
        await UserGameModel.deleteMany({});
        await UserModel.deleteMany({});
        await GameModel.deleteMany({});

        // Create games
        const gameA = await GameModel.create({
            title: "Super Mario Odyssey",
            genres: ["Platformer"],
            parentPlatforms: ["Switch"],
            rawgId: 1,
        });

        const gameB = await GameModel.create({
            title: "Halo Infinite",
            genres: ["Shooter"],
            parentPlatforms: ["Xbox"],
            rawgId: 2,
        });

        gameAId = gameA._id.toString();
        gameBId = gameB._id.toString();

        // Create users
        const user1 = await UserModel.create({
            username: "player_01",
            email: "player01@example.com",
        });

        const user2 = await UserModel.create({
            username: "player_02",
            email: "player02@example.com",
        });

        // Seed library data
        await UserGameModel.create([
            {
                userId: user1._id,
                gameId: gameA._id,
                status: "completed",
            },
            {
                userId: user1._id,
                gameId: gameB._id,
                status: "owned",
            },
            {
                userId: user2._id,
                gameId: gameA._id,
                status: "owned",
            },
        ]);
    });

    it("returns correct community snapshot stats", async () => {
        const res = await request(app)
            .get("/api/community/dashboard")
            .set("x-api-key", process.env.API_KEY!)
            .expect(200);

        expect(res.body).toHaveProperty("snapshot");

        const snapshot = res.body.snapshot;

        expect(snapshot.players).toBe(2);
        expect(snapshot.gamesInLibraries).toBe(3);
        expect(snapshot.totalCompletions).toBe(1);
        expect(snapshot.completionRatePct).toBe(33);

        expect(snapshot.mostPopularGenre).toEqual(
            expect.objectContaining({
                name: expect.any(String),
                count: expect.any(Number),
            })
        );

        expect(res.body).toHaveProperty("mostCompletedGames");

        const mostCompletedGames = res.body.mostCompletedGames;

        expect(Array.isArray(mostCompletedGames)).toBe(true);
        expect(mostCompletedGames.length).toBe(1);

        expect(mostCompletedGames[0]).toEqual(
            expect.objectContaining({
                gameId: gameAId,
                title: "Super Mario Odyssey",
                completionCount: 1,
            })
        );
    });

    it("returns zeroed snapshot when no users or games exist", async () => {
        await UserGameModel.deleteMany({});
        await UserModel.deleteMany({});
        await GameModel.deleteMany({});

        const res = await request(app)
            .get("/api/community/dashboard")
            .set("x-api-key", process.env.API_KEY!)
            .expect(200);

        expect(res.body.snapshot).toEqual({
            players: 0,
            gamesInLibraries: 0,
            totalCompletions: 0,
            completionRatePct: 0,
            mostPopularGenre: null,
        });

        expect(res.body.mostCompletedGames).toEqual([]);
    });
});

describe("GET /api/community/dashboard – error handling", () => {
    it("returns 500 when the dashboard service throws", async () => {
        jest
            .spyOn(communityService, "buildCommunityDashboardService")
            .mockRejectedValueOnce(new Error("Boom"));

        const res = await request(app)
            .get("/api/community/dashboard")
            .set("x-api-key", process.env.API_KEY!)
            .expect(500);

        expect(res.text).toBe("Internal server error");
    });
});