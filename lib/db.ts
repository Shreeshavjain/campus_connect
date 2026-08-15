/**
 * MongoDB connection utility.
 *
 * Caches the Mongoose connection in a module-level variable so that
 * Next.js hot-reloads in development don't open a new connection on
 * every file change. In production each serverless function instance
 * keeps its own connection for the lifetime of the instance.
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable is not set. " +
      "Create a .env.local file with MONGODB_URI=<your connection string>."
  );
}

/** Cached connection promise — survives hot-reloads in development. */
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = (global as unknown as { _mongooseCache: typeof cached })._mongooseCache;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as unknown as { _mongooseCache: typeof cached })._mongooseCache =
    cached;
}

/**
 * Returns a resolved Mongoose instance. Call this at the top of every
 * API route or server utility that needs the database.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        // Recommended settings for Mongoose 7+
        bufferCommands: false,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
