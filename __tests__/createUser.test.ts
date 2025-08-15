// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import mongoose from "mongoose";

describe("POST /users", () => { 

  const username = "johnny"
  const email = "johnny@gmail.com"

    beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  
  it.only("adds a new user to the user collection", async () => {
  const res = await request(app)
    .post(`/api/users`)
    .send({ username, email })
    .expect(201);

  expect(res.body.gamesOwned.length).toBe(0);
  expect(res.body.username).toBe(username);
  expect(res.body.email).toBe(email);
  expect(res.body).toHaveProperty("_id");

});

it.only("returns 400 if user already exists with the given email", async () => {
    
    await UserModel.create({ username, email });

    const res = await request(app)
      .post("/api/users")
      .send({ username, email })
      .expect(400);

    expect(res.body.message).toMatch("email already exists on an existing user");
  });

// TODO:
// check username doesn't already exist
// check post request has expected body i.e. username and email 
// validation on provided email, and/or in front end?


//   it("returns a 404 if the user ID doesn't exist", async () => {
//       const fakeUserId = new mongoose.Types.ObjectId().toString();

//   const res = await request(app)
//     .post(`/api/users/${fakeUserId}/games`)
//     .send({ gameId })
//     .expect(404);

//     expect(res.body.message).toBe("User not found");

// });

//   it("returns a 404 if the game ID doesn't exist", async () => {
//     const fakeGameId = new mongoose.Types.ObjectId().toString();

//   const res = await request(app)
//     .post(`/api/users/${userId}/games`)
//     .send({ gameId: fakeGameId })
//     .expect(404);

//     expect(res.body.message).toBe("Game not found");

// });

//   it("returns a 400 if the user already owns the game", async () => {

//     await request(app)
//     .post(`/api/users/${userId}/games`)
//     .send({ gameId })
//     .expect(200);

//     const res = await request(app)
//       .post(`/api/users/${userId}/games`)
//       .send({ gameId })
//       .expect(400);

//     expect(res.body.message).toBe("Game already owned");

// });

// it("returns a 400 if the game ID is invalid", async () => {

  
//     const res = await request(app)
//       .post(`/api/users/${userId}/games`)
//       .send({ gameId: "banana" })
//       .expect(400);

//     expect(res.body.message).toBe("Invalid game Id");

// });

// it("returns a 400 if the user ID is invalid", async () => {

  
//     const res = await request(app)
//       .post(`/api/users/banana/games`)
//       .send({ gameId })
//       .expect(400);

//     expect(res.body.message).toBe("Invalid user Id");

// });

});