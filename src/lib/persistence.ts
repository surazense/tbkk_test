"use client";

/**
 * Smart Persistence Cache for Sensor Summaries
 * Uses IndexedDB to store aggregated daily metrics.
 */

const DB_NAME = "tbkk_sensor_warehouse";
const STORE_NAME = "daily_summaries";
const DB_VERSION = 1;

export interface DailySummary {
  sensorId: string;
  date: string; // ISO Date YYYY-MM-DD
  totalPackets: number;
  h: number;
  v: number;
  a: number;
  lostMins: number;
  bucketHits: Record<number, number>; // Local bucket index -> count
  lastUpdated: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: ["sensorId", "date"] });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getDailySummary(sensorId: string, dateStr: string): Promise<DailySummary | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get([sensorId, dateStr]);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Cache Read Error:", error);
    return null;
  }
}

export async function saveDailySummary(summary: DailySummary): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(summary);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Cache Write Error:", error);
  }
}

export async function clearOldCache(daysToKeep: number = 30): Promise<void> {
  // Optional cleanup logic
}
