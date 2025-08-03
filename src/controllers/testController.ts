// controllers/testController.ts
import { Request, Response } from 'express';
import { UserModel } from "../models/User";

export const resetTestUserLibrary = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).send('Not allowed in production');
  }

  const user = await UserModel.findOne({ username: 'test' });
  if (!user) return res.status(404).send('Test user not found');

  user.gamesOwned = [];
  await user.save();

  res.sendStatus(204);
};
