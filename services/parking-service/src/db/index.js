const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { RxDBDevModePlugin } = require('rxdb/plugins/dev-mode');

// Only add dev-mode plugin in development
if (process.env.NODE_ENV !== 'production') {
  addRxPlugin(RxDBDevModePlugin);
}

const parkingSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    city: { type: 'string' },
    zone: { type: 'string' },
    total_spots: { type: 'integer' },
    available_spots: { type: 'integer' },
    is_full: { type: 'boolean' },
    updated_at: { type: 'string' },
  },
  required: ['id', 'name', 'city', 'zone', 'total_spots', 'available_spots'],
};

let db = null;
let parkingCollection = null;

async function initDb() {
  db = await createRxDatabase({
    name: process.env.DB_NAME || 'parking_db',
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  });

  const collections = await db.addCollections({
    parkings: { schema: parkingSchema },
  });

  parkingCollection = collections.parkings;
  console.log('Parking RxDB initialized');
  return parkingCollection;
}

function getCollection() {
  if (!parkingCollection) throw new Error('DB not initialized');
  return parkingCollection;
}

module.exports = { initDb, getCollection };
