import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { UserModel } from '../src/models/User';
import { GameModel } from '../src/models/Game';
// Adjust the import path if different in your repo
import { UserGameModel } from '../src/models/UserGame';

const MONGO = process.env.MONGO_URI!;
if (!MONGO) throw new Error('Missing MONGO_URI env var');

/** ---------- Config ---------- */
const NUM_USERS = 17;
const MIN_GAMES_PER_USER = 8;
const MAX_GAMES_PER_USER = 25;

// When true, clear previous seeded users + their libraries first
const DROP_EXISTING = true;

// Keep fake users clearly identifiable but harmless
const EMAIL_DOMAIN = 'example.com';
const EMAIL_PREFIX = 'demo'; // demo01@example.com etc.

// If your LibraryStatus enum is different, tweak this:
const STATUSES = ['owned', 'completed', 'wishlist'] as const;
type LibraryStatus = typeof STATUSES[number];

/** ---------- Helpers ---------- */
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;


const sample = <T>(arr: readonly T[]) => arr[randInt(0, arr.length - 1)];


function usernameFromIndex(i: number) {
    return `player_${String(i + 1).padStart(2, '0')}`;
}

function emailFromUsername(u: string) {
    return `${u.replace(/[^a-z0-9]+/gi, '.').toLowerCase()}@${EMAIL_DOMAIN}`;
}

/** ---------- Main ---------- */
async function run() {
    await mongoose.connect(MONGO);
    console.log('✅ Mongo connected');

    // (Optional) purge any previously seeded users + their libraries
    if (DROP_EXISTING) {
        const oldUsers = await UserModel.find({ isRealUser: false }).select('_id').lean();
        if (oldUsers.length) {
            const ids = oldUsers.map(u => u._id);
            const delUG = await UserGameModel.deleteMany({ userId: { $in: ids } });
            const delU = await UserModel.deleteMany({ _id: { $in: ids } });
            console.log(`🧹 Purged seeded: users=${delU.deletedCount} userGames=${delUG.deletedCount}`);
        } else {
            console.log('🧹 No previously seeded users found');
        }
    }

    // Grab a big pool of Game ids to draw from
    // (Only need ids; add conditions if you want to limit to games with images, etc.)
    const allGames = await GameModel.find({}, { _id: 1 }).lean();
    if (allGames.length === 0) {
        throw new Error('No games found. Seed games first.');
    }
    console.log(`🎮 Available games to assign: ${allGames.length}`);

    // Create users
    const usersToCreate = Array.from({ length: NUM_USERS }).map((_, i) => {
        const username = usernameFromIndex(i);
        return {
            username,
            usernameLower: username.toLowerCase(),
            email: emailFromUsername(username), // hidden by default via select:false in schema
            role: 'user' as const,
            isRealUser: false, // hidden via select:false but stored
            lastSeenAt: new Date(Date.now() - randInt(0, 14) * 86_400_000), // up to 2 weeks ago
        };
    });

    const createdUsers = await UserModel.insertMany(usersToCreate, { ordered: false });
    console.log(`👥 Created ${createdUsers.length} fake users`);

    // For each user, create random UserGame entries
    let totalUserGames = 0;
    for (const u of createdUsers) {
        const want = randInt(MIN_GAMES_PER_USER, MAX_GAMES_PER_USER);

        // Random unique picks from the game pool
        const picked: Types.ObjectId[] = [];
        const used = new Set<number>();
        while (picked.length < want && used.size < allGames.length) {
            const idx = randInt(0, allGames.length - 1);
            if (used.has(idx)) continue;
            used.add(idx);
            picked.push(allGames[idx]._id as Types.ObjectId);
        }

        // Prepare bulk ops
        const ops = picked.map((gameId, i) => {
            const status: LibraryStatus = sample(STATUSES);
            const createdAt = new Date(Date.now() - randInt(1, 90) * 86_400_000); // up to ~3 months ago
            const updatedAt = new Date(createdAt.getTime() + randInt(0, 20) * 86_400_000);

            return {
                updateOne: {
                    filter: { userId: u._id, gameId },
                    update: {
                        $setOnInsert: {
                            userId: u._id,
                            gameId,
                            createdAt,
                        },
                        $set: {
                            status,
                            updatedAt,
                        },
                    },
                    upsert: true,
                },
            };
        });

        if (ops.length) {
            const res = await UserGameModel.bulkWrite(ops, { ordered: false });
            const wrote = (res.upsertedCount || 0) + (res.modifiedCount || 0);
            totalUserGames += wrote;
            console.log(`📚 ${u.username} — library added/updated: ${wrote}`);
        }
    }

    console.log(`\n🎉 DONE — users=${createdUsers.length}, userGames total=${totalUserGames}`);

    await mongoose.disconnect();
    console.log('🔌 Mongo disconnected');
}

run().catch(async (e) => {
    console.error(e);
    try { await mongoose.disconnect(); } catch { }
    process.exit(1);
});
