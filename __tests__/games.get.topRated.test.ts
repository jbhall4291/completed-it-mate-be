// __tests__/games.get.topRated.test.ts
import request from "supertest";
import app from "../src/app";
import { GameModel } from "../src/models/Game";

describe("GET /api/games/top (integration)", () => {
    beforeEach(async () => {
        await GameModel.deleteMany({});

        // Small deterministic seed for ordering + filtering tests
        await GameModel.create([
            {
                title: "Alpha", slug: "alpha", parentPlatforms: ["pc"],
                releaseDate: "2001-01-01", avgCompletionTime: 10, rawgId: 1,
                metacritic: { score: 90 },
            },
            {
                title: "Mario", slug: "mario", parentPlatforms: ["switch"],
                releaseDate: "2017-10-27", avgCompletionTime: 15, rawgId: 2,
                metacritic: { score: 95 }, // tie 95
            },
            {
                title: "Zelda", slug: "zelda", parentPlatforms: ["switch"],
                releaseDate: "2017-03-03", avgCompletionTime: 20, rawgId: 3,
                metacritic: { score: 95 }, // tie 95 (should come after 'Mario' by title asc)
            },
            {
                title: "NullScore", slug: "nullscore", parentPlatforms: ["pc"],
                releaseDate: "2000-01-01", avgCompletionTime: 5, rawgId: 4,
                metacritic: { score: null as any }, // should be filtered out by service
            },
            {
                title: "Bravo", slug: "bravo", parentPlatforms: ["pc"],
                releaseDate: "2005-05-05", avgCompletionTime: 12, rawgId: 5,
                metacritic: { score: 98 },
            },
            {
                title: "Charlie", slug: "charlie", parentPlatforms: ["pc"],
                releaseDate: "2006-06-06", avgCompletionTime: 12, rawgId: 6,
                metacritic: { score: 88 },
            },
        ]);
    });

    it("returns default limit=5 and sorts by score desc, then title asc", async () => {
        const res = await request(app)
            .get("/api/games/top")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // 6 seeded docs, but one has null score → filtered to 5 (and default limit is 5 anyway)
        expect(res.body).toHaveLength(5);

        const titles = res.body.map((g: any) => g.title);
        // Scores: Bravo(98), Mario(95), Zelda(95), Alpha(90), Charlie(88)
        expect(titles).toEqual(["Bravo", "Mario", "Zelda", "Alpha", "Charlie"]);
    });

    it("respects provided numeric limit", async () => {
        const res = await request(app)
            .get("/api/games/top")
            .query({ limit: "2" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        const titles = res.body.map((g: any) => g.title);
        expect(titles).toEqual(["Bravo", "Mario"]); // top two by score, tie broken by title
    });

    it("clamps: huge → 24, zero/NaN → 5", async () => {
        // Seed a bigger set to exercise the 24 cap
        await GameModel.deleteMany({});
        const docs = Array.from({ length: 30 }).map((_, i) => ({
            title: `G${i.toString().padStart(2, "0")}`,
            slug: `g-${i}`,
            parentPlatforms: ["pc"],
            releaseDate: "2010-01-01",
            avgCompletionTime: 10,
            rawgId: 100 + i,
            metacritic: { score: 100 - i }, // descending scores
        }));
        await GameModel.create(docs);

        // 999 -> capped at 24
        const huge = await request(app)
            .get("/api/games/top")
            .query({ limit: "999" })
            .set("x-api-key", process.env.API_KEY!);
        expect(huge.status).toBe(200);
        expect(huge.body).toHaveLength(24);

        // 0 -> default 5 (because controller uses `|| 5` before clamp)
        const zero = await request(app)
            .get("/api/games/top")
            .query({ limit: "0" })
            .set("x-api-key", process.env.API_KEY!);
        expect(zero.status).toBe(200);
        expect(zero.body).toHaveLength(5);

        // NaN -> default 5
        const bad = await request(app)
            .get("/api/games/top")
            .query({ limit: "nope" })
            .set("x-api-key", process.env.API_KEY!);
        expect(bad.status).toBe(200);
        expect(bad.body).toHaveLength(5);
    });
});
