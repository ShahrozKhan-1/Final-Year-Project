// src/utils/indexedDBUtils.js
import { openDB } from 'idb';

const DB_NAME = 'SmartAssessDB';
const DB_VERSION = 1;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('answers')) {
        db.createObjectStore('answers', { keyPath: 'testId' });
      }
      if (!db.objectStoreNames.contains('pending_submissions')) {
        db.createObjectStore('pending_submissions', { keyPath: 'testId' });
      }
    },
  });
};

export const saveAnswersToIndexedDB = async (testId, answers) => {
  const db = await initDB();
  await db.put('answers', { testId, answers });
};

export const getAnswersFromIndexedDB = async (testId) => {
  const db = await initDB();
  const record = await db.get('answers', testId);
  return record?.answers || {};
};

export const savePendingSubmission = async (testId, payload) => {
  const db = await initDB();
  await db.put('pending_submissions', { testId, payload });
};

export const getPendingSubmission = async (testId) => {
  const db = await initDB();
  const record = await db.get('pending_submissions', testId);
  return record?.payload || null;
};

export const clearTestData = async (testId) => {
  const db = await initDB();
  await db.delete('answers', testId);
  await db.delete('pending_submissions', testId);
};
