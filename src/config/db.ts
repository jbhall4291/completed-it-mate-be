// db.ts
/* eslint-disable no-console */              // quiet the logger warnings for this file

import mongoose from 'mongoose';
import { UserModel } from '../models/User';

const connectDB = async (mongoUri?: string): Promise<mongoose.Mongoose> => {
  const uri = mongoUri ?? process.env['MONGO_URI'];
  if (!uri) throw new Error('MONGO_URI is not set');


  const autoIndex = process.env.NODE_ENV !== 'production';
  const conn = await mongoose.connect(uri, { autoIndex });

  // event listeners (ignore in coverage; logs are noisy in tests)
  /* istanbul ignore next */ mongoose.connection.on('error', (e: unknown) => {
    console.error('[Mongo error]', e);
  });
  /* istanbul ignore next */ mongoose.connection.on('disconnected', () => {
    console.warn('[Mongo] disconnected');
  });

  // import models AFTER connect
  const [{ UserGameModel }, { GameModel }] = await Promise.all([
    import('../models/UserGame'),
    import('../models/Game'),
  ]);

  if (process.env.SKIP_INDEX_SYNC !== '1') {
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore next */ console.log('[DB] Syncing indexes (dev)…');
      await Promise.all([
        UserModel.syncIndexes(),
        UserGameModel.syncIndexes(),
        GameModel.syncIndexes(),
      ]);
    } else {
      /* istanbul ignore next */ console.log('[DB] Creating indexes (prod)…');
      await Promise.all([
        UserModel.createIndexes(),
        UserGameModel.createIndexes(),
        GameModel.createIndexes(),
      ]);
    }
    /* istanbul ignore next */ console.log('[DB] Indexes ready.');
  }

  return conn;
};

export default connectDB;
