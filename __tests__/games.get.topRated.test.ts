// __tests__/games.get.topRated.test.ts
import request from "supertest";
import app from "../src/app";
import * as gameSvc from "../src/services/gameService"; // match your controller's import

jest.mock("../src/services/gameService");
const asMock = (fn: unknown) => fn as jest.Mock;

describe("GET /api/games/top", () => {
    beforeEach(() => jest.clearAllMocks());

    it("uses default limit=5 when not provided", async () => {
        asMock(gameSvc.getTopRatedGamesService).mockResolvedValueOnce([{ id: "1" }]);

        const res = await request(app)
            .get("/api/games/top")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: "1" }]);
        expect(gameSvc.getTopRatedGamesService).toHaveBeenCalledWith(5);
    });

    it("uses provided numeric limit", async () => {
        asMock(gameSvc.getTopRatedGamesService).mockResolvedValueOnce([{ id: "1" }]);

        await request(app)
            .get("/api/games/top")
            .query({ limit: "10" })
            .set("x-api-key", process.env.API_KEY!);

        expect(gameSvc.getTopRatedGamesService).toHaveBeenCalledWith(10);
    });

    it("clamps/corrects limit (999 → 24, 0/NaN → 5)", async () => {
        asMock(gameSvc.getTopRatedGamesService).mockResolvedValue([{ id: "x" }]);

        await request(app)
            .get("/api/games/top")
            .query({ limit: "999" })
            .set("x-api-key", process.env.API_KEY!);
        expect(gameSvc.getTopRatedGamesService).toHaveBeenLastCalledWith(24);

        await request(app)
            .get("/api/games/top")
            .query({ limit: "0" })
            .set("x-api-key", process.env.API_KEY!);
        expect(gameSvc.getTopRatedGamesService).toHaveBeenLastCalledWith(5);

        await request(app)
            .get("/api/games/top")
            .query({ limit: "nope" })
            .set("x-api-key", process.env.API_KEY!);
        expect(gameSvc.getTopRatedGamesService).toHaveBeenLastCalledWith(5);
    });

    it("500 when service throws", async () => {
        asMock(gameSvc.getTopRatedGamesService).mockRejectedValueOnce(new Error("db"));

        const res = await request(app)
            .get("/api/games/top")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "Error fetching top rated games" });
    });
});
