// __tests__/games.get.detail.test.ts
import request from "supertest";
import app from "../src/app";

// Match the import path used in your controller
import * as gameSvc from "../src/services/gameService";

jest.mock("../src/services/gameService");
const asMock = (fn: unknown) => fn as jest.Mock;

describe("GET /api/games/:idOrSlug", () => {
    beforeEach(() => jest.clearAllMocks());

    it("200 — returns dto and passes idOrSlug + userId to service", async () => {
        const dto = { id: "pong-1972", title: "Pong" };
        asMock(gameSvc.getGameDetailService).mockResolvedValueOnce(dto);

        const res = await request(app)
            .get("/api/games/pong-1972")
            .query({ userId: "u123" })
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(dto);
        expect(gameSvc.getGameDetailService).toHaveBeenCalledWith("pong-1972", "u123");
    });

    it("200 — passes undefined userId when not provided", async () => {
        const dto = { id: "1", title: "Game 1" };
        asMock(gameSvc.getGameDetailService).mockResolvedValueOnce(dto);

        const res = await request(app)
            .get("/api/games/1")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(gameSvc.getGameDetailService).toHaveBeenCalledWith("1", undefined);
    });

    it("404 — when service returns null", async () => {
        asMock(gameSvc.getGameDetailService).mockResolvedValueOnce(null);

        const res = await request(app)
            .get("/api/games/missing-slug")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: "Game not found" });
    });

    it("500 — when service throws", async () => {
        asMock(gameSvc.getGameDetailService).mockRejectedValueOnce(new Error("db down"));

        const res = await request(app)
            .get("/api/games/pong-1972")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "db down" }); // controller returns err?.message ?? 'Error fetching game'
    });
});
