// src/models/Game.ts
import mongoose, { Schema, Types, InferSchemaType } from "mongoose";

const GameSchema = new Schema(
  {
    rawgId: { type: Number, unique: true, index: true, required: true },
    slug: { type: String, index: true },               // RAWG slug (helpful for search/dedupe)
    title: { type: String, required: true },

    // Use null for TBA. Store as Date for easy sorting/filtering.
    releaseDate: { type: Date, default: null },

    avgCompletionTime: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },

    // Parent platform badges (keep loose; icon map handles known ones)
    // e.g. ["pc","playstation","xbox","nintendo","ios","android","mac","linux","web"]
    parentPlatforms: { type: [String], default: [] },

    // Granular platforms list for details page / filtering if needed
    // e.g. [{ id: 187, slug: "playstation5", name: "PlayStation 5" }, ...]
    platformsDetailed: {
      type: [{ id: Number, slug: String, name: String }],
      default: []
    }
  },
  {
    versionKey: false
  }
);

// Optional helpful indexes
GameSchema.index({ title: 1 });


export type IGame = InferSchemaType<typeof GameSchema> & { _id: Types.ObjectId };

export const GameModel = mongoose.model<IGame>("Game", GameSchema);
