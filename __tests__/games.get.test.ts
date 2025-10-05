// addGameToUser.test.ts
import request from "supertest";
import app from "../src/app";

import { GameModel } from "../src/models/Game";

describe("GET /api/games/search", () => {
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

    it("returns games that match the query string", async () => {
        const res = await request(app)
            .get(`/api/games`)
            .query({ titleQuery: "Halo" })
            .set("x-api-key", process.env.API_KEY!)

        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Halo Infinite" }),
            ])
        );

    });

    it("returns all games when no titleQuery is provided", async () => {
        const res = await request(app)
            .get("/api/games")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it("returns 500 if GameModel.find throws", async () => {
        // Arrange: temporarily mock GameModel.find to throw
        const originalFind = GameModel.find;
        (GameModel.find as any) = jest.fn().mockImplementation(() => {
            throw new Error("DB error");
        });

        // Act
        const res = await request(app)
            .get("/api/games")
            .set("x-api-key", process.env.API_KEY!);

        // Assert
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "Error fetching games" });

        // Cleanup: restore original
        GameModel.find = originalFind;
    });

});