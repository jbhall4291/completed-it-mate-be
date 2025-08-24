// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";
import mongoose from "mongoose";

describe("PATCH /api/library/:userGameId", () => {
    let userId: string;
    let gameId: string;
    let userGameId: string;

    beforeEach(async () => {
        const game = await GameModel.create({
            title: "Halo Infinite",
            platform: "Xbox",
            releaseDate: "2021-12-08",
            avgCompletionTime: 20
        });

        gameId = game._id.toString();

        const user = await UserModel.create({
            username: "johnny",
            email: "johnny@example.com",
        });

        userId = user._id.toString();

        // Create the junction doc we’re going to patch
        const ug = await UserGameModel.create({
            userId: user._id,
            gameId: game._id,
            status: "owned",
        });

        userGameId = ug._id.toString();

    });

    it("updates the game in user's library to 'status: completed', and returns 200", async () => {
        const res = await request(app)
            .patch(`/api/library/${userGameId}`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ status: "completed" })
            .expect(200);


        expect(res.body).toHaveProperty("_id", userGameId);
        expect(res.body).toHaveProperty("userId", userId);
        expect(res.body).toHaveProperty("gameId", gameId);
        expect(res.body).toHaveProperty("status", "completed");

        // verify DB actually updated
        const inDb = await UserGameModel.findById(userGameId).lean();
        expect(inDb?.status).toBe("completed");

    });

    it("400 when given an invalid ObjectId", async () => {
        const res = await request(app)
            .patch(`/api/library/not-a-valid-id`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ status: "completed" })
            .expect(400);

        expect(res.body.message).toBe("Invalid userGame Id");
    });

    it("400 when given an invalid status", async () => {
        const res = await request(app)
            .patch(`/api/library/${userGameId}`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ status: "not-a-real-status" })
            .expect(400);

        expect(res.body.message).toBe("Invalid status");
    });

    it("404 when userGameId is valid but not found", async () => {
        const missingId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .patch(`/api/library/${missingId}`)
            .set("x-api-key", process.env.API_KEY!)
            .send({ status: "completed" })
            .expect(404);

        expect(res.body.message).toBe("Library item not found");
    });




});