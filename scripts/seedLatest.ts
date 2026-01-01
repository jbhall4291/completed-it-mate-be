// scripts/seedLatest.ts
import 'dotenv/config';
import axios, { AxiosResponse } from 'axios';
import mongoose from 'mongoose';
import { GameModel } from '../src/models/Game';

const MONGO = process.env.MONGO_URI!;
const KEY = process.env.RAWG_API_KEY!;
const RAWG = 'https://api.rawg.io/api';

const PAGE_SIZE = 40;
const BATCH = 6;                // "concurrency" via chunking loop
const PAGE_DELAY_MS = 150;      // polite delay between list pages
const CHUNK_WRITE = 500;       // bulkWrite chunk size
const LATEST_LIMIT = 400; // how many games should we limit to?

const d = (x: Date) => x.toISOString().slice(0, 10);


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
    tags?: { name: string; slug: string }[];
};

const toDate = (released: string | null, tba: boolean) =>
    !released || tba ? null : (isNaN(new Date(released).getTime()) ? null : new Date(released));

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/* ---------------------------------------------------
   Robust request wrapper (retries + HTML guard)
---------------------------------------------------*/
function isJson(res: AxiosResponse) {
    const ct = (res.headers?.['content-type'] || '').toLowerCase();
    return ct.includes('application/json') || ct.includes('application/vnd.api+json');
}

async function safeGet<T>(url: string, params: Record<string, any>, label: string, maxRetries = 6): Promise<AxiosResponse<T>> {
    let attempt = 0;
    while (true) {
        try {
            const res = await axios.get<T>(url, {
                params: { key: KEY, ...params },
                headers: { 'User-Agent': 'CompletedItMate/seed' },
                validateStatus: s => (s >= 200 && s < 300) || s === 429 || (s >= 500 && s < 600),
            });
            if (!isJson(res)) throw new Error(`Non-JSON response (${res.status})`);
            if (res.status === 429) throw new Error('429 Too Many Requests');
            if (res.status >= 500) throw new Error(`Server error ${res.status}`);
            return res;
        } catch (e: any) {
            attempt++;
            if (attempt > maxRetries) throw e;
            const backoff = Math.min(2000 * attempt, 8000) + Math.floor(Math.random() * 500);
            process.stdout.write(`\n⏳ retry ${attempt}/${maxRetries} ${label} in ${backoff}ms`);
            await delay(backoff);
        }
    }
}

/* ---------------------------------------------------
   Paging
---------------------------------------------------*/
async function fetchListSegment(limit: number, params: Record<string, any>, label: string): Promise<List[]> {
    const out: List[] = [];
    let page = 1;
    while (!limit || out.length < limit) {
        const res = await safeGet<{ results: List[] }>(`${RAWG}/games`, { page, page_size: PAGE_SIZE, ...params }, `${label} p${page}`);
        const batch = res.data?.results ?? [];
        if (!batch.length) break;
        out.push(...batch);
        const shown = limit ? Math.min(out.length, limit) : out.length;
        process.stdout.write(`\r📄 [${label}] Listed ${shown}${limit ? '/' + limit : ''}`);
        page += 1;
        await delay(PAGE_DELAY_MS);
        if (limit && out.length >= limit) break;
    }
    process.stdout.write('\n');
    return limit ? out.slice(0, limit) : out;
}


/* ---------------------------------------------------
   Get latest releases, last 90 days
---------------------------------------------------*/
async function fetchLatest(): Promise<List[]> {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 90);

    const res = await fetchListSegment(
        LATEST_LIMIT, // or whatever cap you want
        {
            ordering: '-released',
            dates: `${d(from)},${d(today)}`,
        },
        'Latest_90d'
    );

    return res;
}

/* ---------------------------------------------------
   Detail + mapping
---------------------------------------------------*/
async function fetchDetail(id: number): Promise<Detail> {
    const res = await safeGet<Detail>(`${RAWG}/games/${id}`, {}, `detail ${id}`);
    return res.data;
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

    storeLinks: [] as { store: string; url: string }[],
    metacritic: d.metacritic != null ? { score: d.metacritic, url: d.metacritic_url ?? '' } : null,
});

/* ---------------------------------------------------
   Hygiene
---------------------------------------------------*/
const NSFW_TITLE_RE = /(lust|sex|hentai|porno?|xxx|erotic|nsfw|waifu|strip|3d\s*sex|hot\s*girls?)/i;
// exclude these platforms entirely
const EXCLUDE_PLATFORMS = new Set(['linux', 'android', 'web']);

const NSFW_TAG_SLUGS = new Set([
    'nsfw',
    'sexual-content',
    'nudity',
    'mature',
    'adult',
    'porn',
    'hentai',
    'eroge',
]);

const NSFW_TAG_NAME_RE =
    /(nsfw|nudity|sexual|sex|adult|mature|hentai|erotic|для\s*взрослых)/i;

function hasNSFWTags(detail: any): boolean {
    const tags = detail?.tags ?? [];
    return tags.some(
        (t: any) =>
            NSFW_TAG_SLUGS.has((t.slug || '').toLowerCase()) ||
            NSFW_TAG_NAME_RE.test(t.name || '')
    );
}


/* ---------------------------------------------------
   Main
---------------------------------------------------*/
async function run() {
    await mongoose.connect(MONGO);
    console.log('\n✅ Mongo connected');

    const list = await fetchLatest();
    console.log(`\n📦 Will process ${list.length} games`);

    const docs: { doc: ReturnType<typeof map>; detail: Detail }[] = [];
    for (let i = 0; i < list.length; i += BATCH) {
        const chunk = list.slice(i, i + BATCH);

        const chunkDocs = await Promise.all(
            chunk.map(async (g) => {
                try {
                    const d = await fetchDetail(g.id);
                    return { doc: map(g, d), detail: d };
                } catch {
                    return { doc: map(g, g as any), detail: g as any };
                }
            })
        );

        docs.push(...chunkDocs);


        docs.push(...chunkDocs);
        process.stdout.write(`\r🔎 Detailed ${Math.min(i + chunk.length, list.length)}/${list.length}`);
        await delay(80);
    }
    process.stdout.write('\n');

    // Filter NSFW + unwanted platforms

    const rejected: { title: string; reason: string }[] = [];

    const cleaned = docs.filter(({ doc, detail }) => {
        if (NSFW_TITLE_RE.test(doc.title || '')) {
            rejected.push({ title: doc.title, reason: 'title' });
            return false;
        }

        if (hasNSFWTags(detail)) {
            rejected.push({ title: doc.title, reason: 'tags' });
            return false;
        }

        if (!doc.parentPlatforms || doc.parentPlatforms.length === 0) {
            rejected.push({ title: doc.title, reason: 'no_platforms' });
            return false;
        }

        if (!doc.imageUrl) {
            rejected.push({ title: doc.title, reason: 'no_image' });
            return false;
        }

        const fromParent = (doc.parentPlatforms || []).map(s => String(s).toLowerCase());
        const fromDetailed = ((doc as any).platformsDetailed || []).map((p: any) => (p?.slug || '').toLowerCase());
        const slugs = new Set([...fromParent, ...fromDetailed]);

        for (const bad of EXCLUDE_PLATFORMS) {
            if (slugs.has(bad)) {
                rejected.push({ title: doc.title, reason: `platform:${bad}` });
                return false;
            }
        }

        return true;
    });



    const finalDocs = cleaned.map(x => x.doc);

    if (rejected.length) {
        console.log(`🚫 Rejected ${rejected.length} games (sample):`);
        rejected
            .slice(0, 20)
            .forEach(r => console.log(`  - ${r.title} [${r.reason}]`));

        if (rejected.length > 20) {
            console.log(`  …and ${rejected.length - 20} more`);
        }
    }



    // Write in chunks
    let upserted = 0, modified = 0;
    for (let i = 0; i < finalDocs.length; i += CHUNK_WRITE) {
        const slice = finalDocs.slice(i, i + CHUNK_WRITE);
        const ops = slice.map(doc => ({
            updateOne: { filter: { rawgId: doc.rawgId }, update: { $set: doc }, upsert: true },
        }));
        const res = await GameModel.bulkWrite(ops, { ordered: false });
        upserted += res.upsertedCount ?? 0;
        modified += res.modifiedCount ?? 0;
        console.log(`🧱 wrote ${Math.min(i + CHUNK_WRITE, finalDocs.length)}/${finalDocs.length} (↑${res.upsertedCount ?? 0} ~${res.modifiedCount ?? 0})`);
        await delay(120);
    }

    console.log(`🎉 TOTAL upserted=${upserted} modified=${modified} (kept ${finalDocs.length}; filtered ${docs.length - finalDocs.length})`);

    await mongoose.disconnect();
    console.log('🔌 Mongo disconnected');
}

run().catch(async e => {
    console.error(e?.response?.data || e);
    try { await mongoose.disconnect(); } catch { }
    process.exit(1);
});
