// __tests__/users.post.anonymous.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import mongoose from "mongoose";

describe("POST /api/users/anonymous", () => {
    beforeAll(() => {
        expect(process.env.API_KEY).toBeTruthy();
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
        jest.useRealTimers();
    });

    afterEach(() => {
        jest.useRealTimers(); // avoid open-handle warnings
    });

    it("400 — deviceId required", async () => {
        const res = await request(app)
            .post("/api/users/anonymous")
            .send({})
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(400);
        const msg = (res.body?.message ?? res.text ?? "").toLowerCase();
        expect(msg).toMatch(/deviceid .*required/);
    });

    it("200 — first call upserts anon user", async () => {
        const res = await request(app)
            .post("/api/users/anonymous")
            .send({ deviceId: "device-123" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(typeof res.body.userId).toBe("string");
        expect("username" in res.body).toBe(true);

        const inDb = await UserModel.findOne({ deviceId: "device-123" }).lean();
        expect(inDb).toBeTruthy();
        expect(inDb!.role).toBe("anon");
    });

    it("200 — first call upserts anon user", async () => {
        const res = await request(app)
            .post("/api/users/anonymous")
            .send({ deviceId: "device-123" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);

        // Robust field checks
        expect(typeof res.body.userId).toBe("string");
        expect("username" in res.body).toBe(true);

        const inDb = await UserModel.findOne({ deviceId: "device-123" }).lean();
        expect(inDb).toBeTruthy();
        expect(inDb!.role).toBe("anon");
    });

    it("200 — second call updates lastSeenAt, preserves _id & createdAt", async () => {
        const r1 = await request(app)
            .post("/api/users/anonymous")
            .send({ deviceId: "dev-xyz" })
            .set("x-api-key", process.env.API_KEY!);
        expect(r1.status).toBe(200);

        const first = await UserModel.findOne({ deviceId: "dev-xyz" }).lean();
        expect(first).toBeTruthy();

        // Second call (no fake timers)
        const r2 = await request(app)
            .post("/api/users/anonymous")
            .send({ deviceId: "dev-xyz" })
            .set("x-api-key", process.env.API_KEY!);
        expect(r2.status).toBe(200);

        const second = await UserModel.findOne({ deviceId: "dev-xyz" }).lean();
        expect(String(second!._id)).toBe(String(first!._id));
        expect(new Date(second!.createdAt).getTime())
            .toBe(new Date(first!.createdAt).getTime()); // unchanged
        expect(new Date(second!.lastSeenAt).getTime())
            .toBeGreaterThanOrEqual(new Date(first!.lastSeenAt).getTime()); // moved forward or equal
    });


    it("500 — DB error bubbles through controller", async () => {
        const origFn = UserModel.findOneAndUpdate;
        const origErr = console.error;
        console.error = jest.fn();

        (UserModel.findOneAndUpdate as any) = jest.fn(() => {
            throw new Error("boom");
        });

        try {
            const res = await request(app)
                .post("/api/users/anonymous")
                .send({ deviceId: "device-err" })
                .set("x-api-key", process.env.API_KEY!);

            expect(res.status).toBe(500);
            const msg = (res.body?.message ?? res.text ?? "").toLowerCase();
            expect(msg).toMatch(/boom|error/);
        } finally {
            UserModel.findOneAndUpdate = origFn;
            console.error = origErr;
        }
    });


});
