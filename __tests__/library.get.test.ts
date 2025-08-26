// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";
import mongoose from "mongoose";

describe("GET /api/library", () => {
    let userId: string;
    let gameId1: string;
    let gameId2: string;
    let rawgSeq = 1;

    beforeEach(async () => {

        const [game1, game2] = await Promise.all([
            GameModel.create({
                title: "Halo Infinite",
                platform: "Xbox",
                releaseDate: "2021-12-08",
                avgCompletionTime: 20,
                rawgId: rawgSeq++,
            }),
            GameModel.create({
                title: "Doom",
                platform: "PC",
                releaseDate: "2016-05-13",
                avgCompletionTime: 10,
                rawgId: rawgSeq++,
            }),

        ])

        const user = await UserModel.create({
            username: "johnny",
            email: "johnny@example.com",
        });

        userId = user._id.toString();
        gameId1 = game1._id.toString();
        gameId2 = game2._id.toString();

        await UserGameModel.create({ userId, gameId: gameId1, status: "owned", });
        await UserGameModel.create({ userId, gameId: gameId2, status: "wishlist" });

    });

    it("lists all games in the user’s library", async () => {
        const res = await request(app)
            .get(`/api/library?userId=${userId}`)
            .set("x-api-key", process.env.API_KEY!)

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);

        // basic shape checks
        expect(res.body[0]).toHaveProperty("userId", userId);
        expect(res.body[0]).toHaveProperty("gameId");
        expect(res.body[0]).toHaveProperty("status");
    });

    it("includes game details (title/platform) for each library item", async () => {
        const res = await request(app)
            .get(`/api/library?userId=${userId}`)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);

        // populated object, not just an ObjectId
        expect(typeof res.body[0].gameId).toBe("object");
        expect(res.body[0].gameId).toHaveProperty("title");
        expect(res.body[0].gameId).toHaveProperty("platform");

        // sanity check values
        const titles = res.body.map((x: any) => x.gameId.title).sort();
        expect(titles).toEqual(["Doom", "Halo Infinite"].sort());
    });

    it("returns 400 if userId is missing", async () => {
        const res = await request(app)
            .get(`/api/library`) // no query param
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("userId is required");
    });

    it("returns 400 if userId is invalid", async () => {
        const res = await request(app)
            .get(`/api/library?userId=banana`) // not a valid ObjectId
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid user Id");
    });

    it("returns 404 if user does not exist", async () => {
        const fakeUserId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .get(`/api/library?userId=${fakeUserId}`)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User not found");
    });


});