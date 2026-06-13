'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fileFor(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

const queues = new Map();
function enqueue(collection, task) {
  const prev = queues.get(collection) || Promise.resolve();
  const next = prev.then(task, task);
  queues.set(collection, next.catch(() => {}));
  return next;
}

async function read(collection) {
  ensureDir();
  try {
    const raw = await fsp.readFile(fileFor(collection), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(collection, rows) {
  ensureDir();
  const target = fileFor(collection);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
  await fsp.rename(tmp, target);
  return rows;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const db = {
  all(collection) {
    return enqueue(collection, () => read(collection));
  },
  insert(collection, doc) {
    return enqueue(collection, async () => {
      const rows = await read(collection);
      const record = { id: genId(), createdAt: new Date().toISOString(), ...doc };
      rows.push(record);
      await writeAll(collection, rows);
      return record;
    });
  },
  update(collection, id, patch) {
    return enqueue(collection, async () => {
      const rows = await read(collection);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
      await writeAll(collection, rows);
      return rows[idx];
    });
  }
};

module.exports = db;
