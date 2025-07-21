// removeGameFromUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import mongoose from "mongoose";

describe("DELETE /users/:id/games", () => {
  let userId: string;
  let gameId: string;

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
      gamesOwned: []
    });

    userId = user._id.toString();
    gameId = game._id.toString();
  });

  it("returns a 200 and removes a existing game from the user's library", async () => {

    await request(app)
        .post(`/api/users/${userId}/games`)
        .send({ gameId })
        .expect(200);

      const res = await request(app)
        .delete(`/api/users/${userId}/games`)
        .send({ gameId })
        .expect(200);

      expect(res.body.gamesOwned.length).toBe(0);
  });

  
  it("returns a 404 when trying to remove a game from the user's library when its not already present", async () => {

      const res = await request(app)
        .delete(`/api/users/${userId}/games`)
        .send({ gameId })
        .expect(404);

      expect(res.body.message).toBe("Game not owned");
  });

});