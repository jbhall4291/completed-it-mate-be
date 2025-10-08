// __tests__/games.get.detail.test.ts
import request from "supertest";
import app from "../src/app";
import { GameModel } from "../src/models/Game";
import { UserModel } from "../src/models/User";
import { UserGameModel } from "../src/models/UserGame";

describe("GET /api/games/:idOrSlug (integration)", () => {
    let game: any;
    let userA: any;
    let userB: any;
    let userC: any;

    beforeEach(async () => {
        await Promise.all([
            GameModel.deleteMany({}),
            UserModel.deleteMany({}),
            UserGameModel.deleteMany({}),
        ]);

        // Seed core docs
        game = await GameModel.create({
            title: "Pong",
            slug: "pong-1972",
            parentPlatforms: ["arcade"],
            releaseDate: "1972-11-29",
            avgCompletionTime: 1,
            rawgId: 1972,
            metacritic: { score: 75 },
            genres: ["sports"],
            developers: ["Atari"],
            publishers: ["Atari"],
            description: "Classic.",
            screenshots: [],
            storeLinks: [],
            imageUrl: null,
        });

        userA = await UserModel.create({ username: "alice", email: "a@example.com" });
        userB = await UserModel.create({ username: "bob", email: "b@example.com" });
        userC = await UserModel.create({ username: "cara", email: "c@example.com" });

        // Per-user relationship for the requester (A)
        await UserGameModel.create({
            userId: userA._id,
            gameId: game._id,
            status: "owned",
        });

        // Two completions to drive completedCount=2
        await UserGameModel.create({ userId: userB._id, gameId: game._id, status: "completed" });
        await UserGameModel.create({ userId: userC._id, gameId: game._id, status: "completed" });
    });

    it("200 — resolves by slug and includes per-user status & completedCount", async () => {
        const res = await request(app)
            .get("/api/games/pong-1972")
            .query({ userId: String(userA._id) })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);

        // minimal assertions on the DTO (service maps lots of fields)
        expect(res.body).toEqual(
            expect.objectContaining({
                _id: String(game._id),
                title: "Pong",
                userStatus: "owned",
                userGameId: expect.any(String),
                completedCount: 2,
            })
        );
    });

    it("200 — resolves by ObjectId as idOrSlug (regex branch)", async () => {
        const res = await request(app)
            .get(`/api/games/${String(game._id)}`)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(String(game._id));
        expect(res.body.title).toBe("Pong");
    });

    it("404 — when game does not exist", async () => {
        const res = await request(app)
            .get("/api/games/missing-slug")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: "Game not found" });
    });
});
