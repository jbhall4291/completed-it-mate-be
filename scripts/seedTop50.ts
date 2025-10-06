// scripts/seedGames.ts
import 'dotenv/config';
import axios from 'axios';
import mongoose from 'mongoose';
import { GameModel } from '../src/models/Game';

const MONGO = process.env.MONGO_URI!;
const KEY = process.env.RAWG_API_KEY!;
const RAWG = 'https://api.rawg.io/api';

const LIMIT = 500;        // how many games total
const PAGE_SIZE = 40;     // RAWG practical max
const BATCH = 8;          // concurrency for detail fetches

type List = {
    id: number; slug: string; name: string;
    released: string | null; tba: boolean;
    background_image: string | null; playtime: number | null;
    parent_platforms?: { platform: { id: number; slug: string; name: string } }[];
    platforms?: { platform: { id: number; slug: string; name: string } }[];
    genres?: { name: string }[];
    short_screenshots?: { image: string }[];
};

type Detail = List & {
    description_raw?: string | null;
    developers?: { name: string }[];
    publishers?: { name: string }[];
    metacritic?: number | null;
    metacritic_url?: string | null;
    background_image_additional?: string | null;
    short_screenshots?: { image: string }[];
};

const toDate = (released: string | null, tba: boolean) =>
    !released || tba ? null : (isNaN(new Date(released).getTime()) ? null : new Date(released));

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchList(limit: number): Promise<List[]> {
    const out: List[] = [];
    let page = 1;

    while (out.length < limit) {
        const { data } = await axios.get<{ results: List[] }>(`${RAWG}/games`, {
            params: { key: KEY, page, page_size: PAGE_SIZE, ordering: '-rating' },
            headers: { 'User-Agent': 'CompletedItMate/seed' },
        });
        const batch = data.results ?? [];
        if (!batch.length) break;
        out.push(...batch);
        process.stdout.write(`\r📄 Listed ${Math.min(out.length, limit)}/${limit}`);
        page += 1;
        await delay(100);
    }

    const seen = new Set<number>();
    const deduped = out.filter(g => (seen.has(g.id) ? false : (seen.add(g.id), true)));
    return deduped.slice(0, limit);
}

async function fetchDetail(id: number): Promise<Detail> {
    const { data } = await axios.get<Detail>(`${RAWG}/games/${id}`, {
        params: { key: KEY },
        headers: { 'User-Agent': 'CompletedItMate/seed' },
    });
    return data;
}

const map = (l: List, d: Detail) => ({
    rawgId: l.id,
    slug: d.slug ?? l.slug,
    title: l.name,
    imageUrl: l.background_image ?? d.background_image_additional ?? null,
    releaseDate: toDate(l.released, !!l.tba),
    avgCompletionTime: typeof l.playtime === 'number' ? l.playtime : 0,

    parentPlatforms: (d.parent_platforms ?? l.parent_platforms ?? []).map(p => p.platform.slug),
    platformsDetailed: (d.platforms ?? l.platforms ?? []).map(p => p.platform),
    genres: (d.genres ?? l.genres ?? []).map(g => g.name),

    developers: (d.developers ?? []).map(x => x.name),
    publishers: (d.publishers ?? []).map(x => x.name),
    description: d.description_raw ?? null,
    screenshots: (d.short_screenshots ?? l.short_screenshots ?? []).map(s => s.image).slice(0, 8),

    // ⛔️ Skipping store link collection for speed
    storeLinks: [] as { store: string; url: string }[],

    metacritic: d.metacritic != null ? { score: d.metacritic, url: d.metacritic_url ?? '' } : null,
});

async function run() {
    await mongoose.connect(MONGO);
    console.log('\n✅ Mongo connected');

    const list = await fetchList(LIMIT);
    console.log(`\n📦 Will process ${list.length} games`);

    const docs: ReturnType<typeof map>[] = [];
    for (let i = 0; i < list.length; i += BATCH) {
        const chunk = list.slice(i, i + BATCH);

        const chunkDocs = await Promise.all(
            chunk.map(async (g) => {
                try {
                    const detail = await fetchDetail(g.id);
                    return map(g, detail);
                } catch {
                    return map(g, g as any);
                }
            })
        );

        docs.push(...chunkDocs);
        process.stdout.write(`\r🔎 Detailed ${Math.min(i + chunk.length, list.length)}/${list.length}`);
        await delay(120);
    }
    process.stdout.write('\n');

    const ops = docs.map(doc => ({
        updateOne: { filter: { rawgId: doc.rawgId }, update: { $set: doc }, upsert: true },
    }));
    const res = await GameModel.bulkWrite(ops, { ordered: false });
    console.log(`🎉 upserted=${res.upsertedCount ?? 0} modified=${res.modifiedCount ?? 0}`);

    await mongoose.disconnect();
    console.log('🔌 Mongo disconnected');
}

run().catch(async e => {
    console.error(e?.response?.data || e);
    try { await mongoose.disconnect(); } catch { }
    process.exit(1);
});
