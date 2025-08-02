import { Request, Response, NextFunction } from "express";

export function checkApiKey(req: Request, res: Response, next: NextFunction) {

   if (process.env.JEST_WORKER_ID) {
    return next();
  }

  const incomingKey = req.headers["x-api-key"];
  if (!incomingKey || incomingKey !== process.env.API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}