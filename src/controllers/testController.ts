// controllers/testController.ts
import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { UserGameModel } from '../models/UserGame';

export const resetTestUserLibrary = async (req: Request, res: Response) => {
  try {
    // Find test user (hardcoded username or ID)
    await UserGameModel.deleteMany({ userId: '6890a2561ffcdd030b19c08c' });

    return res.sendStatus(204); // No Content
  } catch (err) {
    console.error('Error resetting test user library:', err);
    return res.status(500).send('Internal server error');
  }
};
