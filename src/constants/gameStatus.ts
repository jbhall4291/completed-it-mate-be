//constants/gameStatus
export const allowedStatuses = ["owned", "completed", "wishlist"] as const;
export type GameStatus = typeof allowedStatuses[number];