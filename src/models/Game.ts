import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGame extends Document {
  _id: Types.ObjectId;
  title: string;
  platform: string;
  releaseDate: string;
  avgCompletionTime: number;
}

const GameSchema: Schema = new Schema({
  title: { type: String, required: true },
  platform: { type: String, required: true },
  releaseDate: { type: String, required: true },
  avgCompletionTime: { type: Number, required: true }
});

export const GameModel = mongoose.model<IGame>("Game", GameSchema);
