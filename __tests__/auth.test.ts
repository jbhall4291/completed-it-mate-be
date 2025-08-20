import request from "supertest";
import app from "../src/app";

describe("checkApiKey middleware (integration)", () => {
    beforeEach(() => {
        process.env.API_KEY = "test-secret"; // dummy key for tests
    });

    test("blocks requests with no API key", async () => {
        const res = await request(app).get("/api/users"); // or any protected route
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "Unauthorized" });
    });

    test("blocks requests with wrong API key", async () => {
        const res = await request(app)
            .get("/api/users")
            .set("x-api-key", "wrong-key");
        expect(res.status).toBe(401);
    });

    test("allows requests with correct API key", async () => {
        const res = await request(app)
            .get("/api/users")
            .set("x-api-key", "test-secret");
        expect(res.status).toBe(200);
    });
});
