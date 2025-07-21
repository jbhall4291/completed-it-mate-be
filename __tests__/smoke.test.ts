import request from "supertest";
import app from "../src/app";

describe("Smoke Test", () => {
  it("should confirm the server is running", async () => {
    const res = await request(app).get("/");  // Hit the root route
    expect(res.status).toBe(200);
    expect(res.text).toContain("Server is running");  // Matches our app.ts root route
  });
});
