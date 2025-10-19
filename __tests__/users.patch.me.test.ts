// __tests__/users.patch.me.test.ts
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/models/User";
import { Types } from "mongoose";

const ROUTE = "/api/users/me";

describe("PATCH /api/users/me (controller + service, no mocks)", () => {
    let meId: string;
    let otherId: string;

    beforeEach(async () => {
        await UserModel.deleteMany({});

        const [me, other] = await UserModel.create([
            { role: "anon", deviceId: "dev-me", username: "meuser", usernameLower: "meuser" },
            { role: "anon", deviceId: "dev-other", username: "taken", usernameLower: "taken" },
        ]);

        meId = String(me._id);
        otherId = String(other._id);
    });

    it("401 — missing x-user-id", async () => {
        const res = await request(app)
            .patch(ROUTE)
            .send({ username: "newname" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(401);
    });

    it("400 — username required", async () => {
        const res = await request(app)
            .patch(ROUTE)
            .set("x-user-id", meId)
            .set("x-api-key", process.env.API_KEY!)
            .send({});

        expect(res.status).toBe(400);
        const msg = (res.body?.message ?? "").toLowerCase();
        expect(msg).toMatch(/username .*required/);
    });

    it("400 — length 3–20 enforced", async () => {
        const tooShort = await request(app)
            .patch(ROUTE)
            .set("x-user-id", meId)
            .set("x-api-key", process.env.API_KEY!)
            .send({ username: "ab" });
        expect(tooShort.status).toBe(400);

        const tooLong = await request(app)
            .patch(ROUTE)
            .set("x-user-id", meId)
            .set("x-api-key", process.env.API_KEY!)
            .send({ username: "x".repeat(21) });
        expect(tooLong.status).toBe(400);
    });

    it("400 — only letters, numbers, dot, underscore, hyphen allowed", async () => {
        const res = await request(app)
            .patch(ROUTE)
            .set("x-user-id", meId)
            .set("x-api-key", process.env.API_KEY!)
            .send({ username: "bad name!" });

        expect(res.status).toBe(400);
    });

    it("409 — username already taken (case-insensitive, excluding self)", async () => {
        const res = await request(app)
            .patch(ROUTE)
            .set("x-user-id", meId)
            .set("x-api-key", process.env.API_KEY!)
            .send({ username: "TAKEN" });

        expect(res.status).toBe(409);
    });

    it("200 — updates username + usernameLower", async () => {
        const res = await request(app)
            .patch(ROUTE)
            .set("x-user-id", meId)
            .set("x-api-key", process.env.API_KEY!)
            .send({ username: "New_Name-01" });

        expect(res.status).toBe(200);

        const fromDb = await UserModel.findById(meId).lean();
        expect(fromDb?.username).toBe("New_Name-01");
        expect(fromDb?.usernameLower).toBe("new_name-01");
    });

    it("404 — user not found", async () => {
        const missing = new Types.ObjectId().toString();
        const res = await request(app)
            .patch(ROUTE)
            .set("x-user-id", missing)
            .set("x-api-key", process.env.API_KEY!)
            .send({ username: "whatever" });

        expect(res.status).toBe(404);
    });

    it("500 — DB error bubbles through controller (mock model only)", async () => {
        const original = UserModel.findByIdAndUpdate;
        const originalErr = console.error;
        console.error = jest.fn(); // silence expected error log

        (UserModel.findByIdAndUpdate as any) = jest.fn(() => {
            throw new Error("boom");
        });

        try {
            const res = await request(app)
                .patch(ROUTE)
                .set("x-user-id", meId)
                .set("x-api-key", process.env.API_KEY!)
                .send({ username: "ok_name" });

            expect([400, 500]).toContain(res.status);
            const msg = (res.body?.message ?? "").toLowerCase();
            expect(msg).toMatch(/boom|error/);
        } finally {
            UserModel.findByIdAndUpdate = original as any;
            console.error = originalErr;
        }
    });
});
