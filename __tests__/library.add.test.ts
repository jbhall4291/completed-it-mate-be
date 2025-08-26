// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import mongoose from "mongoose";

describe("POST /api/library", () => {
    let userId: string;
    let gameId: string;

    let rawgSeq = 1;

    beforeEach(async () => {
        const game = await GameModel.create({
            title: "Halo Infinite",
            platform: "Xbox",
            releaseDate: "2021-12-08",
            avgCompletionTime: 20,
            rawgId: rawgSeq++,
        });

        const user = await UserModel.create({
            username: "johnny",
            email: "johnny@example.com",
        });

        userId = user._id.toString();
        gameId = game._id.toString();
    });

    it("adds a game to the user’s library", async () => {
        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId, userId, status: "owned" });

        expect(res.status).toBe(201);
        // Expect a UserGame doc in the response
        expect(res.body).toHaveProperty("userId", userId);
        expect(res.body).toHaveProperty("gameId", gameId);
        expect(res.body).toHaveProperty("status", "owned");
    });

    it("adds a game to the user’s library with a non-default status of 'completed'", async () => {
        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId, userId, status: "completed" });

        expect(res.status).toBe(201);
        // Expect a UserGame doc in the response
        expect(res.body).toHaveProperty("userId", userId);
        expect(res.body).toHaveProperty("gameId", gameId);
        expect(res.body).toHaveProperty("status", "completed");
    });

    it("400 when adding with an invalid game status", async () => {
        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId, userId, status: "banana" })
            .expect(400);

        expect(res.body.message).toBe("Invalid status");
    });


    it("returns a 404 if the user ID doesn't exist", async () => {
        const fakeUserId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId, userId: fakeUserId, status: "owned" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User not found");

    });

    it("returns a 404 if the game ID doesn't exist", async () => {
        const fakeGameId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId: fakeGameId, userId, status: "owned" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Game not found");

    });

    it("returns a 400 if the game ID is invalid", async () => {

        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId: "banana", userId, status: "owned" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid game Id");

    });

    it("returns a 400 if the user ID is invalid", async () => {

        const res = await request(app)
            .post(`/api/library`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ gameId, userId: "banana", status: "owned" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid user Id");

    });

    //TODO: decide if users CAN have multiple copies of same game in their library (different platforms?)
    // it.skip("returns a 400 if the user already owns the game", async () => {

    //     await request(app)
    //         .post(`/api/users/${userId}/games`)
    //         .set("x-api-key", process.env.API_KEY!)
    //         .send({ gameId })
    //         .expect(200);

    //     const res = await request(app)
    //         .post(`/api/users/${userId}/games`)
    //         .set("x-api-key", process.env.API_KEY!)
    //         .send({ gameId })
    //         .expect(400);

    //     expect(res.body.message).toBe("Game already owned");

    // });

});