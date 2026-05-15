const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { RxDBDevModePlugin } = require('rxdb/plugins/dev-mode');

if (process.env.NODE_ENV !== 'production') {
  addRxPlugin(RxDBDevModePlugin);
}

const notificationSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    city: { type: 'string' },
    type: { type: 'string' },
    title: { type: 'string' },
    message: { type: 'string' },
    source_event: { type: 'string' },
    created_at: { type: 'string' },
  },
  required: ['id', 'city', 'type', 'title', 'message', 'source_event', 'created_at'],
};

let notificationCollection = null;

async function initDb() {
  const db = await createRxDatabase({
    name: process.env.DB_NAME || 'notification_db',
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  });

  const collections = await db.addCollections({
    notifications: { schema: notificationSchema },
  });

  notificationCollection = collections.notifications;
  console.log('Notification RxDB initialized');
  return notificationCollection;
}

function getCollection() {
  if (!notificationCollection) throw new Error('DB not initialized');
  return notificationCollection;
}

module.exports = { initDb, getCollection };
