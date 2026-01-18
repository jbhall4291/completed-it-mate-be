// controllers/communityController.ts
import { Request, Response } from "express";
import { buildCommunityDashboardService } from "../services/communityService";

export const getCommunityDashboard = async (req: Request, res: Response) => {
    try {
        const dashboard = await buildCommunityDashboardService();
        return res.status(200).json(dashboard);
    } catch (err) {
        console.error("Error building community dashboard:", err);
        return res.status(500).send("Internal server error");
    }
};