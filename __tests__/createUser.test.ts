// createUser.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import mongoose from "mongoose";

describe.skip("POST /users", () => {

  const username = "johnny"
  const email = "johnny@gmail.com"

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });


  it("adds a new user to the user collection", async () => {
    const res = await request(app)
      .post(`/api/users`)
      .set("x-api-key", process.env.API_KEY!)
      .send({ username, email })
      .expect(201);

    expect(res.body.gamesOwned.length).toBe(0);
    expect(res.body.username).toBe(username);
    expect(res.body.email).toBe(email);
    expect(res.body).toHaveProperty("_id");

  });

  it("returns 400 if user already exists with the given email", async () => {

    await UserModel.create({ username, email });

    const res = await request(app)
      .post("/api/users")
      .set("x-api-key", process.env.API_KEY!)
      .send({ username, email })
      .expect(400);

    expect(res.body.message).toMatch("email already exists on an existing user");
  });


  it("returns 400 if user already exists with the given username", async () => {

    const differentEmail = "adifferentemail@email.com"
    await UserModel.create({ username, email: differentEmail });

    const res = await request(app)
      .post("/api/users")
      .set("x-api-key", process.env.API_KEY!)
      .send({ username, email })
      .expect(400);

    expect(res.body.message).toMatch("username already exists on an existing user");
  });


  it("falls back to 400 + generic message when service throws a plain Error ", async () => {

    const res = await request(app)
      .post("/api/users")
      .set("x-api-key", process.env.API_KEY!)
      .send({ email: "x@test.com" }) // no username
      .expect(400);

    expect(res.body.message).toBe("Missing required fields");
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("x-api-key", process.env.API_KEY!)
      .send({ username })  // no email
      .expect(400);

    expect(res.body.message).toBe("Missing required fields");
  });



  it("returns a 422 when the passed email fails basic validation check", async () => {

    const res = await request(app)
      .post("/api/users")
      .set("x-api-key", process.env.API_KEY!)
      .send({ username, email: "x@testcom" })
      .expect(422);

    expect(res.body.message).toBe("Invalid email address");
  });

});