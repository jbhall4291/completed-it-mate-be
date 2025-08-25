// scripts/seedTop50.ts
import mongoose from "mongoose";
import "dotenv/config";
import axios from "axios";
import { GameModel } from "../src/models/Game";

const MONGO_URI = process.env.MONGO_URI!;
const RAWG_KEY = process.env.RAWG_API_KEY!;

const pickPlatform = (g: any) =>
    g.platforms?.[0]?.platform?.name || "Unknown";

const mapRawgToGame = (g: any) => ({
    title: g.name,
    platform: pickPlatform(g),
    releaseDate: g.tba ? "TBA" : (g.released || "TBA"),
    avgCompletionTime: typeof g.playtime === "number" ? g.playtime : 0,
});

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const { data } = await axios.get("https://api.rawg.io/api/games", {
        params: { key: RAWG_KEY, page_size: 50, ordering: "-rating" },
    });

    const docs = data.results.map(mapRawgToGame);

    // quick-and-dirty insert (no upsert needed for this one-off)
    await GameModel.insertMany(docs, { ordered: false });
    console.log(`🎉 Inserted ${docs.length} games`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected");
}

run().catch(async (err) => {
    console.error(err?.response?.data || err);
    try { await mongoose.disconnect(); } catch { }
    process.exit(1);
});