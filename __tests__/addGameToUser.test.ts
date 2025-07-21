// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { GameModel } from "../src/models/Game";
import mongoose from "mongoose";

describe("POST /users/:id/games", () => {
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

  it("adds a game to the user's library with correct details", async () => {
  const res = await request(app)
    .post(`/api/users/${userId}/games`)
    .send({ gameId })
    .expect(200);

  expect(res.body.gamesOwned.length).toBe(1);
  expect(res.body.gamesOwned[0].gameId.toString()).toBe(gameId);
});

  it("returns a 404 if the user ID doesn't exist", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

  const res = await request(app)
    .post(`/api/users/${fakeUserId}/games`)
    .send({ gameId })
    .expect(404);

    expect(res.body.message).toBe("User not found");

});

  it("returns a 404 if the game ID doesn't exist", async () => {
    const fakeGameId = new mongoose.Types.ObjectId().toString();

  const res = await request(app)
    .post(`/api/users/${userId}/games`)
    .send({ gameId: fakeGameId })
    .expect(404);

    expect(res.body.message).toBe("Game not found");

});

  it("returns a 400 if the user already owns the game", async () => {

    await request(app)
    .post(`/api/users/${userId}/games`)
    .send({ gameId })
    .expect(200);

    const res = await request(app)
      .post(`/api/users/${userId}/games`)
      .send({ gameId })
      .expect(400);

    expect(res.body.message).toBe("Game already owned");

});

it("returns a 400 if the game ID is invalid", async () => {

  
    const res = await request(app)
      .post(`/api/users/${userId}/games`)
      .send({ gameId: "banana" })
      .expect(400);

    expect(res.body.message).toBe("Invalid game Id");

});

it("returns a 400 if the user ID is invalid", async () => {

  
    const res = await request(app)
      .post(`/api/users/banana/games`)
      .send({ gameId })
      .expect(400);

    expect(res.body.message).toBe("Invalid user Id");

});

});