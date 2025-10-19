// __tests__/gameService.test.ts
import { searchGameTitlesService, buildFilter, attachCompletedCounts } from "../src/services/gameService";
import { GameModel } from "../src/models/Game";

import { Types } from "mongoose";
import { UserGameModel } from "../src/models/UserGame";


describe("searchGameTitlesService", () => {
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
    });

    it("returns [] for empty string", async () => {
        const res = await searchGameTitlesService("");
        expect(res).toEqual([]);
    });

    it("returns [] for whitespace-only", async () => {
        const res = await searchGameTitlesService("   ");
        expect(res).toEqual([]);
    });

    it("treats undefined as empty (exercises ?? RHS)", async () => {
        const res = await searchGameTitlesService(undefined);
        expect(res).toEqual([]);
    });

    it("treats null as empty (also RHS)", async () => {
        // @ts-expect-error intentional: exercise nullish branch
        const res = await searchGameTitlesService(null);
        expect(res).toEqual([]);
    });


    it("falls through when non-empty", async () => {
        const res = await searchGameTitlesService("halo");
        expect(res).toEqual(
            expect.arrayContaining([expect.objectContaining({ title: "Halo Infinite" })])
        );
    });

    it("escapes regex metacharacters ('.*' should not match everything)", async () => {
        const res = await searchGameTitlesService(".*");
        expect(res).toEqual([]);
    });

    it("returns matches for partial, case-insensitive title", async () => {
        const res = await searchGameTitlesService("halo");
        expect(res).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Halo Infinite" }),
            ])
        );
    });

    it("bubbles up DB errors (so the controller can 500)", async () => {
        const originalFind = GameModel.find;
        (GameModel.find as any) = jest.fn().mockImplementation(() => {
            throw new Error("DB error");
        });

        await expect(searchGameTitlesService("halo")).rejects.toThrow("DB error");

        GameModel.find = originalFind; // cleanup
    });
});

describe("buildFilter – branch coverage", () => {
    test("legacy string input: trimmed -> title $regex (i)", () => {
        const f = buildFilter("  mario  ");
        expect(f.title?.$regex).toBeInstanceOf(RegExp);
        expect(f.title.$regex.flags).toContain("i");
        expect(f.title.$regex.source).toContain("mario");
    });

    test("legacy string input: empty or whitespace -> {}", () => {
        expect(buildFilter("")).toEqual({});
        expect(buildFilter("   ")).toEqual({});
    });

    test("undefined/null input -> {}", () => {
        expect(buildFilter(undefined)).toEqual({});
        // @ts-expect-error intentional: exercise nullish path
        expect(buildFilter(null)).toEqual({});
    });

    test("object: q sets case-insensitive regex (trims)", () => {
        const f = buildFilter({ q: "  zelda " });
        expect(f.title.$regex.source).toContain("zelda");
        expect(f.title.$regex.flags).toContain("i");
    });

    test("object: platforms -> parentPlatforms $in (manufacturer-level)", () => {
        const f = buildFilter({ platforms: ['Xbox', 'PlayStation', 'Nintendo'] });
        expect(f.parentPlatforms).toEqual({
            $in: ['xbox', 'playstation', 'nintendo'],
        });
    });

    test("object: genres -> $in", () => {
        const f = buildFilter({ genres: ["rpg", "strategy"] });
        expect(f.genres).toEqual({ $in: ["rpg", "strategy"] });
    });

    test("object: years array -> releasedYear $in", () => {
        const f = buildFilter({ years: [1998, 2001] });
        expect(f.releasedYear).toEqual({ $in: [1998, 2001] });
    });

    test("range: only yearMin -> $gte", () => {
        const f = buildFilter({ yearMin: 2000 });
        expect(f.releasedYear).toEqual({ $gte: 2000 });
    });

    test("range: only yearMax -> $lte", () => {
        const f = buildFilter({ yearMax: 2010 });
        expect(f.releasedYear).toEqual({ $lte: 2010 });
    });

    test("range: both bounds -> $gte & $lte", () => {
        const f = buildFilter({ yearMin: 1990, yearMax: 2000 });
        expect(f.releasedYear).toEqual({ $gte: 1990, $lte: 2000 });
    });

    test("range: non-finite bounds -> omit releasedYear", () => {
        const f = buildFilter({ yearMin: Number.NaN, yearMax: Number.POSITIVE_INFINITY });
        expect(f.releasedYear).toBeUndefined();
    });

    test("combination: q + platforms + genres + years", () => {
        const f = buildFilter({
            q: "mario",
            platforms: ["pc"],
            genres: ["platformer"],
            years: [1985],
        });
        expect(f.parentPlatforms).toEqual({ $in: ["pc"] });
        expect(f.genres).toEqual({ $in: ["platformer"] });
        expect(f.releasedYear).toEqual({ $in: [1985] });
        expect(f.title.$regex).toBeInstanceOf(RegExp);
    });
});

describe("attachCompletedCounts", () => {
    let g1Id: any;
    let g2Id: any;

    beforeEach(async () => {
        await GameModel.deleteMany({});
        await UserGameModel.deleteMany({});

        const [g1, g2] = await GameModel.create([
            { title: "A", parentPlatforms: ["xbox"], releaseDate: "2020-01-01", rawgId: 1 },
            { title: "B", parentPlatforms: ["playstation"], releaseDate: "2021-01-01", rawgId: 2 },
        ]);

        g1Id = g1._id;
        g2Id = g2._id;
    });

    it("returns [] for empty input", async () => {
        const res = await attachCompletedCounts([]);
        expect(res).toEqual([]);
    });

    it("returns completedCount:0 for all when there are no completed rows", async () => {
        const games = await GameModel.find({}).select("_id title").lean();
        const res = await attachCompletedCounts(games as any);
        expect(res).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ _id: g1Id, completedCount: 0 }),
                expect.objectContaining({ _id: g2Id, completedCount: 0 }),
            ])
        );
    });

    it("maps aggregate counts back to each game (including zeros for missing)", async () => {
        // g1 has 2 completed, g2 has 1
        await UserGameModel.create([
            { userId: new Types.ObjectId(), gameId: g1Id, status: "completed" },
            { userId: new Types.ObjectId(), gameId: g1Id, status: "completed" },
            { userId: new Types.ObjectId(), gameId: g2Id, status: "completed" },
            // noise rows that should not count:
            { userId: new Types.ObjectId(), gameId: g1Id, status: "playing" },
            { userId: new Types.ObjectId(), gameId: g2Id, status: "wishlist" },
        ]);

        const games = await GameModel.find({}).select("_id title").lean();
        const res = await attachCompletedCounts(games as any);

        const byId = new Map(res.map((r: any) => [String(r._id), r.completedCount]));
        expect(byId.get(String(g1Id))).toBe(2);
        expect(byId.get(String(g2Id))).toBe(1);
    });
});