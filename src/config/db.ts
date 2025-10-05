// db.ts
import mongoose from 'mongoose';

const connectDB = async (mongoUri?: string) => {
  try {
    const uri = mongoUri || (process.env.MONGO_URI as string);

    // Dev builds indexes automatically; disable in prod
    const autoIndex = process.env.NODE_ENV !== 'production';

    await mongoose.connect(uri, { autoIndex });

    // Ensure indexes exist (import models AFTER connect to avoid cycles)
    const [{ UserGameModel }, { GameModel }] = await Promise.all([
      import('../models/UserGame'),
      import('../models/Game'),
    ]);

    if (process.env.SKIP_INDEX_SYNC !== '1') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DB] Syncing indexes (dev)…');
        await Promise.all([
          UserGameModel.syncIndexes(),
          GameModel.syncIndexes(),
        ]);
      } else {
        console.log('[DB] Creating indexes (prod)…');
        await Promise.all([
          UserGameModel.createIndexes(),
          GameModel.createIndexes(),
        ]);
      }
      console.log('[DB] Indexes ready.');
    }
  } catch (error) {
    console.error(`Mongo connect/index error:`, error);
    process.exit(1);
  }
};

export default connectDB;
