// createUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import mongoose from "mongoose";
import { GameModel } from "../src/models/Game";

describe("GET /users/:id", () => {

    const username = "johnny"
    const email = "johnny@gmail.com"
    let userId: string;

    beforeEach(async () => {
        await UserModel.deleteMany({});

        const user = await UserModel.create({
            username,
            email,
            gamesOwned: []
        });

        userId = user._id.toString();
    });

    it("returns an existing user with the given id", async () => {
        const res = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        expect(res.body._id).toBe(userId);
        expect(res.body.username).toBe(username);
        expect(res.body.email).toBe(email);
    });

    it("returns a 400 when given an invalid user id", async () => {
        const res = await request(app)
            .get("/api/users/fakeID")
            .expect(400);

        expect(res.body.message).toBe("Invalid user Id");

    });

    it("returns a 404 when given a valid but non existent user id", async () => {
        const missingId = new mongoose.Types.ObjectId().toHexString();
        const res = await request(app)
            .get(`/api/users/${missingId}`)
            .expect(404);

        expect(res.body.message).toBe("User not found");
    });

    it("flattens gamesOwned so each entry has game fields directly", async () => {
        const game = await GameModel.create({
            title: "Halo",
            platform: "Xbox",
            releaseDate: "2021-01-01",
            avgCompletionTime: 15
        });
        const newUser = await UserModel.create({
            username,
            email,
            gamesOwned: [{ status: "not started", gameId: game._id }]
        });
        const newUserId = newUser._id.toString();

        const res = await request(app)
            .get(`/api/users/${newUserId}`)
            .expect(200);

        const ownedGame = res.body.gamesOwned[0];

        expect(ownedGame).toHaveProperty("status", "not started");
        expect(ownedGame).toHaveProperty("title", "Halo");
        expect(ownedGame).not.toHaveProperty("gameId");
    });




});