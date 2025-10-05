// __tests__/gameService.test.ts
import { searchGameTitlesService } from "../src/services/gameService";
import { GameModel } from "../src/models/Game";

describe("searchGameTitlesService", () => {
    let rawgSeq = 1;

    beforeEach(async () => {
        await GameModel.deleteMany({});
        await GameModel.create({
            title: "Halo Infinite",
            parentPlatformsplatform: ["xbox"],
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
