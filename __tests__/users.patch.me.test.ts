// __tests__/users.patch.me.test.ts
import request from "supertest";
import app from "../src/app";
import * as userSvc from "../src/services/userService";

jest.mock("../src/services/userService");
const asMock = (fn: unknown) => fn as jest.Mock;
const validId = "507f1f77bcf86cd799439011";

describe("PATCH /api/users/me", () => {
    beforeEach(() => jest.clearAllMocks());

    it("401 — missing x-user-id", async () => {
        const res = await request(app)
            .patch("/api/users/me")
            .send({ username: "newname" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(401);
    });

    it("400 — username required", async () => {
        const res = await request(app)
            .patch("/api/users/me")
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!)
            .send({}); // <= ensure body exists

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "username is required" });
    });

    it("409 — duplicate username", async () => {
        asMock(userSvc.updateUsernameService).mockRejectedValueOnce({ code: 11000 });

        const res = await request(app)
            .patch("/api/users/me")
            .send({ username: "taken" })
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ message: "username already taken" });
    });

    it("200 — updates and returns safe user", async () => {
        asMock(userSvc.updateUsernameService).mockResolvedValueOnce({ _id: validId, username: "neo" });
        asMock(userSvc.toSafeUser).mockImplementation((u) => ({ id: u._id, username: u.username }));

        const res = await request(app)
            .patch("/api/users/me")
            .send({ username: "neo" })
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: validId, username: "neo" });
    });

    it("400 — other service error", async () => {
        asMock(userSvc.updateUsernameService).mockRejectedValueOnce({ status: 400, message: "bad" });

        const res = await request(app)
            .patch("/api/users/me")
            .send({ username: "oops" })
            .set("x-user-id", validId)
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "bad" });
    });
});
