// UserGame.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { allowedStatuses, GameStatus } from "../constants/gameStatus";

export interface IUserGame extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    gameId: Types.ObjectId;
    status: GameStatus;
}

const UserGameSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
        status: {
            type: String,
            enum: allowedStatuses,              // ['owned','playing','completed','wishlist']
            required: true,
            default: 'owned',                   // optional, but handy
        },
    },
    { timestamps: true }
);

// ✅ Integrity (keep)
UserGameSchema.index({ userId: 1, gameId: 1 }, { unique: true });

// ✅ For library lists/sorts (replace the plain userId index with this)
UserGameSchema.index({ userId: 1, status: 1, createdAt: -1 });

// ✅ For completed-counts (critical for your aggregation)
UserGameSchema.index({ gameId: 1, status: 1 });

// (optional) If you only ever count 'completed', a partial index can shrink size:
// UserGameSchema.index(
//   { gameId: 1 },
//   { partialFilterExpression: { status: 'completed' }, name: 'completed_by_game' }
// );

export const UserGameModel = mongoose.model<IUserGame>("UserGame", UserGameSchema);
