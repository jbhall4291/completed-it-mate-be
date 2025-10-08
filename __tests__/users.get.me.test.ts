// __tests__/users.get.me.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import * as userSvc from "../src/services/userService";

jest.mock("../src/services/userService");
const asMock = (fn: unknown) => fn as jest.Mock;
const validId = "507f1f77bcf86cd799439011"; // valid 24-char ObjectId

describe("GET /api/users/me", () => {
    beforeEach(() => jest.clearAllMocks());

    it("401 — missing/invalid x-user-id", async () => {
        const res = await request(app)
            .get("/api/users/me")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(401);
    });

    it("404 — user not found", async () => {
        jest.spyOn(UserModel, "findById").mockReturnValueOnce({
            lean: () => Promise.resolve(null),
        } as any);

        const res = await request(app)
            .get("/api/users/me")
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: "User not found" });
    });

    it("200 — returns safe user", async () => {
        jest.spyOn(UserModel, "findById").mockReturnValueOnce({
            lean: () => Promise.resolve({ _id: validId, username: "john" }),
        } as any);
        asMock(userSvc.toSafeUser).mockImplementation((u) => ({ id: u._id, username: u.username }));

        const res = await request(app)
            .get("/api/users/me")
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: validId, username: "john" });
    });

    it("500 — db error", async () => {
        jest.spyOn(UserModel, "findById").mockReturnValueOnce({
            lean: () => {
                throw new Error("db");
            },
        } as any);

        const res = await request(app)
            .get("/api/users/me")
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "Error fetching user" });
    });
});
