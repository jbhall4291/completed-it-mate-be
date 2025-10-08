// __tests__/games.get.latest.test.ts
import request from "supertest";
import app from "../src/app";
import * as gameSvc from "../src/services/gameService"; // must match controller import

jest.mock("../src/services/gameService");
const asMock = (fn: unknown) => fn as jest.Mock;

describe("GET /api/games/latest", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns items when no limit is provided (uses controller default)", async () => {
        asMock(gameSvc.getLatestReleasesService).mockResolvedValueOnce([{ id: "1" }]);

        const res = await request(app)
            .get("/api/games/latest")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: "1" }]);
        // we don't assert the exact default value—just that a number was used
        expect(gameSvc.getLatestReleasesService).toHaveBeenCalledWith(expect.any(Number));
    });

    it("uses provided numeric limit", async () => {
        asMock(gameSvc.getLatestReleasesService).mockResolvedValueOnce([{ id: "1" }]);

        await request(app)
            .get("/api/games/latest")
            .query({ limit: "10" })
            .set("x-api-key", process.env.API_KEY!);

        expect(gameSvc.getLatestReleasesService).toHaveBeenLastCalledWith(10);
    });

    it("returns 500 when the service throws", async () => {
        asMock(gameSvc.getLatestReleasesService).mockRejectedValueOnce(new Error("db"));
        const res = await request(app)
            .get("/api/games/latest")
            .set("x-api-key", process.env.API_KEY!);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("message"); // avoid tying to exact string
    });
});
