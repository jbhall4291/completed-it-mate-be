// controllers/testController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/User";
import { UserGameModel } from "../models/UserGame";

const TEST_USER_ID_STR = "6890a2561ffcdd030b19c08c";

export const resetTestUserLibrary = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(TEST_USER_ID_STR)) return res.sendStatus(204);
    const TEST_USER_ID = new mongoose.Types.ObjectId(TEST_USER_ID_STR);

    const exists = await UserModel.exists({ _id: TEST_USER_ID });
    if (!exists) return res.sendStatus(204);

    await UserGameModel.deleteMany({ userId: TEST_USER_ID });
    return res.sendStatus(204);
  } catch (err) {
    console.error("Error resetting test user library:", err);
    return res.status(500).send("Internal server error");
  }
};
