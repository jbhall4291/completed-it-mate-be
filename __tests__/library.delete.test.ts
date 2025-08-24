// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";
import mongoose from "mongoose";

describe("DELETE /api/library/:userGameId", () => {

    let userGameId: string;

    beforeEach(async () => {
        const game = await GameModel.create({
            title: "Halo Infinite",
            platform: "Xbox",
            releaseDate: "2021-12-08",
            avgCompletionTime: 20
        });

        const user = await UserModel.create({
            username: "johnny",
            email: "johnny@example.com",
        });

        // Create the junction doc we’re going to delete
        const ug = await UserGameModel.create({
            userId: user._id,
            gameId: game._id,
            status: "owned",
        });

        userGameId = ug._id.toString();

    });

    it("removes the item from the user's library and returns 204", async () => {
        const res = await request(app)
            .delete(`/api/library/${userGameId}`)
            .set("x-api-key", process.env.API_KEY!)

        expect(res.status).toBe(204);
        expect(await UserGameModel.findById(userGameId)).toBeNull();
    });


    it("400 for invalid id", async () => {
        const res = await request(app)
            .delete(`/api/library/banana`)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid userGame Id");
    });

    it("404 when item not found", async () => {
        const fake = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .delete(`/api/library/${fake}`)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Library item not found");
    });


});