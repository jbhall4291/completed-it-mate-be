// __tests__/users.get.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";

describe("GET /api/users", () => {
    beforeEach(() => jest.clearAllMocks());

    it("200 — returns users", async () => {
        const users = [{ _id: "1", username: "a" }];

        const exec = jest.fn().mockResolvedValue(users);
        const queryMock = {
            select: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec,
        };

        jest.spyOn(UserModel, "find").mockReturnValueOnce(queryMock as any);

        const res = await request(app)
            .get("/api/users")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(users);

        // (optional) assert the chain was called
        expect(queryMock.select).toHaveBeenCalledWith("-email -isRealUser");
        expect(queryMock.populate).toHaveBeenCalledWith("gameCount");
        expect(exec).toHaveBeenCalled();
    });


    it("500 — when query throws", async () => {
        jest.spyOn(UserModel, "find").mockReturnValueOnce({
            populate: () => ({
                exec: () => {
                    throw new Error("db");
                },
            }),
        } as any);

        const res = await request(app)
            .get("/api/users")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "Error fetching users", error: expect.anything() });
    });
});
