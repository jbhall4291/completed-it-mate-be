import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGame extends Document {
  rawgId: number;
  _id: Types.ObjectId;
  title: string;
  platform: string;
  releaseDate: string;
  avgCompletionTime: number;
  imageUrl?: string;
}

const GameSchema: Schema = new Schema({
  rawgId: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  platform: { type: String, required: true },
  releaseDate: { type: String, required: true },
  avgCompletionTime: { type: Number, required: true },
  imageUrl: { type: String },
});

export const GameModel = mongoose.model<IGame>("Game", GameSchema);
