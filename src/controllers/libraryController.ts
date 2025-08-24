//libraryController.ts
import { Request, Response } from "express";
import { addToLibraryService, listLibraryService, removeFromLibraryService } from "../services/libraryService";

export const addToLibrary = async (req: Request, res: Response) => {
    try {
        const { userId, gameId, status } = req.body;
        const userGame = await addToLibraryService(userId, gameId, status);
        return res.status(201).json(userGame);

    } catch (err: any) {
        if (err?.status && err?.message) {
            return res.status(err.status).json({ message: err.message });
        }
        if (err?.code === 11000) {
            return res.status(400).json({ message: "Game already owned" });
        }
        return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
    }
};


export const listLibrary = async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const gamesList = await listLibraryService(userId);
        return res.status(200).json(gamesList);
    } catch (err: any) {
        if (err?.status && err?.message) return res.status(err.status).json({ message: err.message });
        if (err?.name === "ValidationError") return res.status(400).json({ message: err.message });
        return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
    }
};

export const removeFromLibrary = async (req: Request, res: Response) => {
    try {
        const { userGameId } = req.params;
        await removeFromLibraryService(userGameId);

        return res.status(204).send();
    } catch (err: any) {
        if (err?.status && err?.message) return res.status(err.status).json({ message: err.message });
        if (err?.name === "ValidationError") return res.status(400).json({ message: err.message });
        return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
    }
};
