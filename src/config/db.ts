// db.ts
import mongoose from 'mongoose';
import { UserModel } from '../models/User';

const connectDB = async (mongoUri?: string) => {
  const uri = mongoUri || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  const autoIndex = process.env.NODE_ENV !== 'production';
  const conn = await mongoose.connect(uri, { autoIndex });

  // optional listeners
  mongoose.connection.on('error', (e) => console.error('[Mongo error]', e));
  mongoose.connection.on('disconnected', () => console.warn('[Mongo] disconnected'));

  // import models AFTER connect
  const [{ UserGameModel }, { GameModel }] = await Promise.all([
    import('../models/UserGame'),
    import('../models/Game'),
  ]);

  if (process.env.SKIP_INDEX_SYNC !== '1') {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DB] Syncing indexes (dev)…');
      await Promise.all([
        UserModel.syncIndexes(),
        UserGameModel.syncIndexes(),
        GameModel.syncIndexes(),
      ]);
    } else {
      console.log('[DB] Creating indexes (prod)…');
      await Promise.all([
        UserModel.createIndexes(),
        UserGameModel.createIndexes(),
        GameModel.createIndexes(),
      ]);
    }
    console.log('[DB] Indexes ready.');
  }

  return conn;
};

export default connectDB;
