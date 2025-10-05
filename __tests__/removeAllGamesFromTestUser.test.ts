// tests/resetTestUserLibrary.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import { UserGameModel } from "../src/models/UserGame";
import mongoose from "mongoose";

const TEST_USER_ID_STR = "6890a2561ffcdd030b19c08c";
const TEST_USER_ID = new mongoose.Types.ObjectId(TEST_USER_ID_STR);

describe("DELETE /api/test/reset-library", () => {
  beforeEach(async () => {
    // Create user with the EXACT id the controller uses
    let rawgSeq = 1;

    await UserModel.create({
      _id: TEST_USER_ID,
      username: "test",
      email: "test@example.com",
    });

    const game1 = await GameModel.create({
      title: "Halo",
      parentPlatforms: ["xbox"],
      releaseDate: "2021-01-01",
      avgCompletionTime: 15,
      rawgId: rawgSeq++,
    });
    const game2 = await GameModel.create({
      title: "Doom",
      parentPlatforms: ["pc"],
      releaseDate: "2016-05-13",
      avgCompletionTime: 12,
      rawgId: rawgSeq++,
    });


    await UserGameModel.create({ userId: TEST_USER_ID, gameId: game1._id, status: "owned" });
    await UserGameModel.create({ userId: TEST_USER_ID, gameId: game2._id, status: "owned" });
  });

  it("returns 204 and clears the test user's library", async () => {
    await request(app)
      .delete("/api/test/reset-library")
      .set("x-api-key", process.env.API_KEY!)
      .expect(204);

    const remaining = await UserGameModel.countDocuments({ userId: TEST_USER_ID });
    expect(remaining).toBe(0);

    const user = await UserModel.findById(TEST_USER_ID);
    expect(user).not.toBeNull();
  });

  it("returns 204 if the test user does not exist", async () => {
    await UserModel.deleteOne({ _id: TEST_USER_ID });

    await request(app)
      .delete("/api/test/reset-library")
      .set("x-api-key", process.env.API_KEY!)
      .expect(204);          // no body for 204
  });
});
