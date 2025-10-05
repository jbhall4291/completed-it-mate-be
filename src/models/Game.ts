// src/models/Game.ts
import mongoose, { Schema, Types, InferSchemaType } from "mongoose";

const GameSchema = new Schema({
  rawgId: { type: Number, unique: true, required: true },
  
  slug: { type: String },                 // no "index: true" here
  title: { type: String, required: true },
  releaseDate: { type: Date, default: null },
  avgCompletionTime: { type: Number, default: 0 },
  imageUrl: { type: String, default: null },
  parentPlatforms: { type: [String], default: [] },
  platformsDetailed: { type: [{ id: Number, slug: String, name: String }], default: [] },
}, { versionKey: false });

/** 🔎 Indexes that actually help your queries */
GameSchema.index({ title: 1 });
GameSchema.index({ parentPlatforms: 1 });
GameSchema.index({ releaseDate: -1 });
GameSchema.index({ slug: 1 }, { unique: true, sparse: true });

export type IGame = InferSchemaType<typeof GameSchema> & { _id: Types.ObjectId };
export const GameModel = mongoose.model<IGame>("Game", GameSchema);
