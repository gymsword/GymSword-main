import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://solankipratham001_db_user:sGKU6OmcoOlUpeqA@cluster0.miwag6w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  try {
    console.log("Connecting...");

    const client = new MongoClient(uri);

    await client.connect();

    console.log("✅ Connected successfully");

    const db = client.db("gymsword");

    const result = await db.admin().ping();

    console.log("Ping Result:", result);

    await client.close();
  } catch (err) {
    console.error("❌ Mongo Error:");
    console.error(err);
  }
}

test();