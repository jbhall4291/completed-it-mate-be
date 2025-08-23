// resetTestUserLibrary.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import mongoose from "mongoose";

describe.skip("DELETE /test/reset-library", () => {
  beforeEach(async () => {
    const game1 = await GameModel.create({
      title: "Halo",
      platform: "Xbox",
      releaseDate: "2021-01-01",
      avgCompletionTime: 15
    });

    const game2 = await GameModel.create({
      title: "Doom",
      platform: "PC",
      releaseDate: "2016-05-13",
      avgCompletionTime: 12
    });

    await UserModel.create({
      username: "test",
      email: "test@example.com",
      gamesOwned: [game1._id, game2._id]
    });
  });

  it("returns a 204 and clears the test user's library", async () => {
    await request(app)
      .delete("/api/test/reset-library")
      .set("x-api-key", process.env.API_KEY!)
      .expect(204);

    const user = await UserModel.findOne({ username: "test" });
    expect(user).not.toBeNull();
    expect(user!.gamesOwned.length).toBe(0);
  });

  it("returns a 404 if the test user does not exist", async () => {
    await UserModel.deleteOne({ username: "test" });

    const res = await request(app)
      .delete("/api/test/reset-library")
      .set("x-api-key", process.env.API_KEY!)
      .expect(404);

    expect(res.text).toBe("Test user not found");
  });
});
