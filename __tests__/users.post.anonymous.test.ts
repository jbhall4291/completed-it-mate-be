// __tests__/users.post.anonymous.test.ts
import request from "supertest";
import app from "../src/app";
import * as userSvc from "../src/services/userService";

jest.mock("../src/services/userService");
const asMock = (fn: unknown) => fn as jest.Mock;

describe("POST /api/users/anonymous", () => {
    beforeEach(() => jest.clearAllMocks());

    it("400 — deviceId required", async () => {
        const res = await request(app)
            .post("/api/users/anonymous")
            .send({})
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "deviceId is required" });
    });

    it("200 — creates/returns anon user (sanitized)", async () => {
        asMock(userSvc.getOrCreateAnonByDeviceId).mockResolvedValueOnce({ _id: "u1", username: "anon_1" });
        asMock(userSvc.toSafeUser).mockImplementation((u) => ({ id: u._id, username: u.username }));

        const res = await request(app)
            .post("/api/users/anonymous")
            .send({ deviceId: "device-123" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(userSvc.getOrCreateAnonByDeviceId).toHaveBeenCalledWith("device-123");
        expect(res.body).toEqual({ id: "u1", username: "anon_1" });
    });

    it("500 — service throws", async () => {
        asMock(userSvc.getOrCreateAnonByDeviceId).mockRejectedValueOnce(new Error("boom"));
        asMock(userSvc.toSafeUser).mockImplementation((u) => u);

        const res = await request(app)
            .post("/api/users/anonymous")
            .send({ deviceId: "device-123" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "boom" });
    });
});
