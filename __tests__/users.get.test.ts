import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";

describe("GET /api/users", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("200 — returns users with completedCount", async () => {
        const users = [
            {
                _id: "1",
                username: "a",
                completedCount: 2,
            },
        ];

        const aggregateSpy = jest
            .spyOn(UserModel, "aggregate")
            .mockResolvedValueOnce(users as any);

        const res = await request(app)
            .get("/api/users")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(users);

        expect(aggregateSpy).toHaveBeenCalledTimes(1);
    });

    it("500 — when aggregation throws", async () => {
        jest
            .spyOn(UserModel, "aggregate")
            .mockRejectedValueOnce(new Error("db"));

        const res = await request(app)
            .get("/api/users")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            message: "Error fetching users",
            error: expect.anything(),
        });
    });
});
