import { promisify } from "util";
import { db } from "../db.js";

// Promise wrapper for database operations
export const dbRun = promisify(db.run.bind(db));
export const dbGet = promisify(db.get.bind(db));
export const dbAll = promisify(db.all.bind(db));

// Helper function for transactions
export async function runInTransaction(callback) {
  await dbRun("BEGIN TRANSACTION");
  try {
    const result = await callback();
    await dbRun("COMMIT");
    return result;
  } catch (error) {
    await dbRun("ROLLBACK");
    throw error;
  }
}
