// games.get.test.ts
import request from "supertest";
import app from "../src/app";
import { GameModel } from "../src/models/Game";
import { Types } from "mongoose";
import { UserGameModel } from "../src/models/UserGame";

describe("GET /api/games", () => {
    let rawgSeq = 1;

    beforeEach(async () => {
        await GameModel.deleteMany({});
        await GameModel.create({
            title: "Halo Infinite",
            parentPlatforms: ["xbox"],
            releaseDate: "2021-12-08",
            avgCompletionTime: 20,
            rawgId: rawgSeq++,
        });
        await GameModel.create({
            title: "Grand Theft Auto 3",
            parentPlatforms: ["xbox"],
            releaseDate: "2000-01-01",
            avgCompletionTime: 30,
            rawgId: rawgSeq++,
        });
    });

    // --- Legacy (no paging) path ---
    it("returns games that match the query string (legacy array response)", async () => {
        const res = await request(app)
            .get(`/api/games`)
            .query({ titleQuery: "Halo" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Halo Infinite" }),
            ])
        );
    });



    // --- Paged envelope path (any paging param present) ---
    it("returns a paged envelope when page & pageSize are provided", async () => {
        const res = await request(app)
            .get("/api/games")
            .query({ page: "1", pageSize: "1" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                page: 1,
                pageSize: 1,
                total: expect.any(Number),
                items: expect.any(Array),
            })
        );
        expect(res.body.items.length).toBeLessThanOrEqual(1);
    });

    it("treats providing only pageSize as paging (defaults page to 1)", async () => {
        const res = await request(app)
            .get("/api/games")
            .query({ pageSize: "2" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body.page).toBe(1);        // defaulted
        expect(res.body.pageSize).toBe(2);
        expect(Array.isArray(res.body.items)).toBe(true);
    });

    it("passes through titleQuery when paging", async () => {
        const res = await request(app)
            .get("/api/games")
            .query({ titleQuery: "Halo", page: "1", pageSize: "10" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        const titles = res.body.items.map((g: any) => g.title);
        expect(titles).toEqual(expect.arrayContaining(["Halo Infinite"]));
    });

    // --- Clamps/defaults ---
    it("clamps page to min 1 and defaults non-numeric page to 1", async () => {
        const neg = await request(app)
            .get("/api/games")
            .query({ page: "-5", pageSize: "10" })
            .set("x-api-key", process.env.API_KEY!);
        expect(neg.status).toBe(200);
        expect(neg.body.page).toBe(1);

        const bad = await request(app)
            .get("/api/games")
            .query({ page: "abc", pageSize: "10" })
            .set("x-api-key", process.env.API_KEY!);
        expect(bad.status).toBe(200);
        expect(bad.body.page).toBe(1);
    });

    it("clamps pageSize: 0/non-numeric -> 24, very large -> 100", async () => {
        const zero = await request(app)
            .get("/api/games")
            .query({ pageSize: "0" })
            .set("x-api-key", process.env.API_KEY!);
        expect(zero.status).toBe(200);
        expect(zero.body.page).toBe(1);
        expect(zero.body.pageSize).toBe(24); // 0 -> 24 due to "|| 24"

        const bad = await request(app)
            .get("/api/games")
            .query({ pageSize: "nope" })
            .set("x-api-key", process.env.API_KEY!);
        expect(bad.status).toBe(200);
        expect(bad.body.pageSize).toBe(24);   // NaN -> 24 due to "|| 24"

        const huge = await request(app)
            .get("/api/games")
            .query({ pageSize: "999" })
            .set("x-api-key", process.env.API_KEY!);
        expect(huge.status).toBe(200);
        expect(huge.body.pageSize).toBe(100); // capped
    });

    it("clamps pageSize: 0/non-numeric -> 24, very large -> 100", async () => {
        const zero = await request(app).get("/api/games").query({ pageSize: "0" }).set("x-api-key", process.env.API_KEY!);
        expect(zero.status).toBe(200);
        expect(zero.body.page).toBe(1);
        expect(zero.body.pageSize).toBe(24); // 0 → 24

        const bad = await request(app).get("/api/games").query({ pageSize: "nope" }).set("x-api-key", process.env.API_KEY!);
        expect(bad.status).toBe(200);
        expect(bad.body.pageSize).toBe(24);   // NaN → 24

        const huge = await request(app).get("/api/games").query({ pageSize: "999" }).set("x-api-key", process.env.API_KEY!);
        expect(huge.status).toBe(200);
        expect(huge.body.pageSize).toBe(100); // capped
    });


    // --- 500 path ---
    it("returns 500 if GameModel.find throws", async () => {
        const originalFind = GameModel.find;
        try {
            (GameModel.find as any) = jest.fn(() => { throw new Error("DB error"); });
            const res = await request(app).get("/api/games").set("x-api-key", process.env.API_KEY!);
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Error fetching games" });
        } finally {
            GameModel.find = originalFind as any;
        }
    });



    it("attaches completedCount in paged mode", async () => {
        // throws if not found → no null in the type
        const haloDoc = await GameModel.findOne({ title: "Halo Infinite" }).orFail();
        const haloId = haloDoc._id;

        await UserGameModel.deleteMany({});
        await UserGameModel.create({
            userId: new Types.ObjectId(),
            gameId: haloId,
            status: "completed",
        });

        const res = await request(app)
            .get("/api/games")
            .query({ page: "1", pageSize: "10" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        const haloItem = res.body.items.find((g: any) => g.title === "Halo Infinite");
        expect(haloItem).toBeTruthy();
        expect(haloItem.completedCount).toBe(1);
    });

});
