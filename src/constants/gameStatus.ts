//constants/gameStatus
export const allowedStatuses = ["owned", "playing", "completed", "wishlist"] as const;
export type GameStatus = typeof allowedStatuses[number];