import { MongoClient } from "mongodb";

let client = null;
let db = null;

export async function connectDb() {
  if (db) return db;
  const url = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!url || !dbName) throw new Error("MONGO_URL and DB_NAME must be set");
  client = new MongoClient(url, { maxPoolSize: 50 });
  console.log("Mongo URL:", process.env.MONGO_URL);
console.log("DB Name:", process.env.DB_NAME);
 try {
  await client.connect();
  console.log("Mongo Connected Successfully");
} catch (err) {
  console.error("Mongo Connection Error:");
  console.error(err);
  throw err;
}
  db = client.db(dbName);
  console.log(`[gymsword] mongodb connected: ${dbName}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error("DB not initialized");
  return db;
}

export async function closeDb() {
  if (client) await client.close();
}
