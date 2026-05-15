const { v4: uuidv4 } = require('uuid');
const { getCollection } = require('./db');
const { produceEvent } = require('./kafka/producer');
const { TOPICS } = require('../../../kafka/kafkaClient');

async function getAllParkings(call, callback) {
  try {
    const collection = getCollection();
    const { city } = call.request;
    const query = city
      ? collection.find({ selector: { city } })
      : collection.find();
    const docs = await query.exec();
    callback(null, { parkings: docs.map(docToParking) });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function getParkingById(call, callback) {
  try {
    const collection = getCollection();
    const doc = await collection.findOne(call.request.id).exec();
    if (!doc) return callback({ code: 5, message: 'Parking not found' });
    callback(null, docToParking(doc));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function createParking(call, callback) {
  try {
    const collection = getCollection();
    const { name, city, zone, total_spots, available_spots } = call.request;
    if (!name || !city || !zone) return callback({ code: 3, message: 'name, city and zone are required' });

    const id = uuidv4();
    const is_full = available_spots <= 0;
    const updated_at = new Date().toISOString();

    const doc = await collection.insert({ id, name, city, zone, total_spots, available_spots, is_full, updated_at });

    await produceEvent(TOPICS.PARKING_AVAILABLE, { id, name, city, zone, available_spots });

    callback(null, docToParking(doc));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function updateParking(call, callback) {
  try {
    const collection = getCollection();
    const { id, available_spots } = call.request;
    const doc = await collection.findOne(id).exec();
    if (!doc) return callback({ code: 5, message: 'Parking not found' });

    const was_full = doc.is_full;
    const is_full = available_spots <= 0;
    const updated_at = new Date().toISOString();

    await doc.patch({ available_spots, is_full, updated_at });
    const updated = await collection.findOne(id).exec();

    // Publish Kafka events based on state change
    if (is_full && !was_full) {
      await produceEvent(TOPICS.PARKING_FULL, { id, name: doc.name, city: doc.city, zone: doc.zone });
      console.log(`Parking ${doc.name} is now FULL`);
    } else if (!is_full && was_full) {
      await produceEvent(TOPICS.PARKING_AVAILABLE, {
        id, name: doc.name, city: doc.city, zone: doc.zone, available_spots,
      });
      console.log(`Parking ${doc.name} has available spots again`);
    }

    callback(null, docToParking(updated));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function deleteParking(call, callback) {
  try {
    const collection = getCollection();
    const doc = await collection.findOne(call.request.id).exec();
    if (!doc) return callback({ code: 5, message: 'Parking not found' });
    await doc.remove();
    callback(null, { success: true, message: 'Parking deleted' });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function docToParking(doc) {
  const d = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: d.id, name: d.name, city: d.city, zone: d.zone,
    total_spots: d.total_spots, available_spots: d.available_spots,
    is_full: d.is_full, updated_at: d.updated_at,
  };
}

module.exports = { getAllParkings, getParkingById, createParking, updateParking, deleteParking };
