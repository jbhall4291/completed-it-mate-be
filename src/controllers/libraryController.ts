//libraryController.ts
import { Request, Response } from "express";
import {
    addToLibraryService,
    listLibraryService,
    removeFromLibraryService,
    updateUserGameStatusService
} from "../services/libraryService";
import { allowedStatuses, GameStatus } from "../constants/gameStatus";

export const addToLibrary = async (req: Request, res: Response) => {
    const { userId, gameId, status = "owned" } = req.body;

    if (!allowedStatuses.includes(status as GameStatus)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
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

export const updateUserGameStatus = async (req: Request, res: Response) => {
    const { userGameId } = req.params;
    const { status } = req.body;

    if (!allowedStatuses.includes(status as GameStatus)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const updatedUserGame = await updateUserGameStatusService(userGameId, status);
        return res.status(200).json(updatedUserGame);
    } catch (err: any) {
        return res.status(err.status || 500).json({ message: err.message });
    }
};
