// __tests__/games.get.latest.test.ts
import request from "supertest";
import app from "../src/app";
import { GameModel } from "../src/models/Game";

describe("GET /api/games/latest (integration)", () => {
    beforeEach(async () => {
        await GameModel.deleteMany({});

        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const iso = (d: Date) => d.toISOString().slice(0, 10);

        // Allowed platforms (NOT in exclude list): e.g., xbox, ps5, switch
        await GameModel.create([
            // newest day (tie on date; should sort title asc)
            { title: "Alpha 2024", parentPlatforms: ["xbox"], releaseDate: "2024-03-10", avgCompletionTime: 5, rawgId: 1 },
            { title: "Bravo 2024", parentPlatforms: ["switch"], releaseDate: "2024-03-10", avgCompletionTime: 5, rawgId: 2 },

            // older
            { title: "Gamma 2023", parentPlatforms: ["ps5"], releaseDate: "2023-11-01", avgCompletionTime: 5, rawgId: 3 },
            { title: "Delta 2022", parentPlatforms: ["xbox"], releaseDate: "2022-06-15", avgCompletionTime: 5, rawgId: 4 },
            { title: "Echo 2021", parentPlatforms: ["switch"], releaseDate: "2021-01-01", avgCompletionTime: 5, rawgId: 5 },

            // should be EXCLUDED (future date)
            { title: "Future Game", parentPlatforms: ["xbox"], releaseDate: iso(tomorrow), avgCompletionTime: 5, rawgId: 6 },

            // should be EXCLUDED (platform in exclude list: pc)
            { title: "PC Shovel", parentPlatforms: ["pc"], releaseDate: "2024-02-01", avgCompletionTime: 5, rawgId: 7 },
        ]);
    });

    it("returns default limit=5 and excludes future-dated + excluded platforms; sorts by date desc then title asc", async () => {
        const res = await request(app)
            .get("/api/games/latest")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(5); // default is 5

        const titles = res.body.map((g: any) => g.title);
        // Expected order: 2024-03-10 (Alpha, Bravo sorted by title asc), then 2023, 2022, 2021
        expect(titles).toEqual(["Alpha 2024", "Bravo 2024", "Gamma 2023", "Delta 2022", "Echo 2021"]);
        expect(titles).not.toContain("Future Game");
        expect(titles).not.toContain("PC Shovel");
    });

    it("respects provided numeric limit", async () => {
        const res = await request(app)
            .get("/api/games/latest")
            .query({ limit: "2" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        const titles = res.body.map((g: any) => g.title);
        expect(titles).toEqual(["Alpha 2024", "Bravo 2024"]);
    });

    it("clamps: huge → 24, zero/NaN → 5", async () => {
        // Create a bunch of allowed items to exercise the 24 cap
        await GameModel.deleteMany({});
        const base = new Date("2023-01-01T00:00:00Z");
        const docs = Array.from({ length: 30 }).map((_, i) => ({
            title: `L${String(i).padStart(2, "0")}`,
            parentPlatforms: ["xbox"], // allowed
            releaseDate: new Date(base.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            avgCompletionTime: 5,
            rawgId: 100 + i,
        }));
        await GameModel.create(docs);

        // 999 -> capped at 24
        const huge = await request(app)
            .get("/api/games/latest")
            .query({ limit: "999" })
            .set("x-api-key", process.env.API_KEY!);
        expect(huge.status).toBe(200);
        expect(huge.body).toHaveLength(24);

        // 0 -> default 5 (controller uses `|| 5`)
        const zero = await request(app)
            .get("/api/games/latest")
            .query({ limit: "0" })
            .set("x-api-key", process.env.API_KEY!);
        expect(zero.status).toBe(200);
        expect(zero.body).toHaveLength(5);

        // NaN -> default 5
        const bad = await request(app)
            .get("/api/games/latest")
            .query({ limit: "nope" })
            .set("x-api-key", process.env.API_KEY!);
        expect(bad.status).toBe(200);
        expect(bad.body).toHaveLength(5);
    });
});
