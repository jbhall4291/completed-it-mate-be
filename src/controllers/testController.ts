// controllers/testController.ts
import { Request, Response } from 'express';
import { UserModel } from "../models/User";

export const resetTestUserLibrary = async (req: Request, res: Response) => {

  try {
    const user = await UserModel.findOne({ username: 'test' });
    if (!user) {
      console.warn('Reset failed: test user not found');
      return res.status(404).send('Test user not found');
    }

    user.gamesOwned = [];
    await user.save();

    return res.sendStatus(204); // No Content
  } catch (err) {
    console.error('Error resetting test user library:', err);
    return res.status(500).send('Internal server error');
  }
};
