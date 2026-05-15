const { v4: uuidv4 } = require('uuid');
const { db } = require('./db');
const { produceEvent } = require('./kafka/producer');
const { TOPICS } = require('../../../kafka/kafkaClient');

function getAllTraffic(call, callback) {
  try {
    const { city } = call.request;
    const rows = city
      ? db.prepare('SELECT * FROM traffic WHERE city = ?').all(city)
      : db.prepare('SELECT * FROM traffic').all();
    callback(null, { traffic: rows.map(rowToTraffic) });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function getTrafficById(call, callback) {
  try {
    const row = db.prepare('SELECT * FROM traffic WHERE id = ?').get(call.request.id);
    if (!row) return callback({ code: 5, message: 'Traffic record not found' });
    callback(null, rowToTraffic(row));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function createTraffic(call, callback) {
  try {
    const { city, zone, status, congestion_level, road_condition } = call.request;
    if (!city || !zone) return callback({ code: 3, message: 'city and zone are required' });

    const id = uuidv4();
    const updated_at = new Date().toISOString();
    const finalStatus = status || 'FREE';
    const finalCongestion = congestion_level || 0;
    const finalCondition = road_condition || 'NORMAL';

    db.prepare(
      'INSERT INTO traffic (id, city, zone, status, congestion_level, road_condition, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, city, zone, finalStatus, finalCongestion, finalCondition, updated_at);

    const record = db.prepare('SELECT * FROM traffic WHERE id = ?').get(id);

    // Publish Kafka event
    await produceEvent(TOPICS.TRAFFIC_STATUS_UPDATED, {
      id, city, zone, status: finalStatus, congestion_level: finalCongestion,
    });

    // Check for traffic jam
    if (finalCongestion >= 70) {
      await produceEvent(TOPICS.TRAFFIC_JAM_DETECTED, { id, city, zone, congestion_level: finalCongestion });
    }

    callback(null, rowToTraffic(record));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function updateTraffic(call, callback) {
  try {
    const { id, status, congestion_level, road_condition } = call.request;
    const existing = db.prepare('SELECT * FROM traffic WHERE id = ?').get(id);
    if (!existing) return callback({ code: 5, message: 'Traffic record not found' });

    const updated_at = new Date().toISOString();
    const newStatus = status || existing.status;
    const newCongestion = congestion_level !== undefined ? congestion_level : existing.congestion_level;
    const newCondition = road_condition || existing.road_condition;

    db.prepare(
      'UPDATE traffic SET status = ?, congestion_level = ?, road_condition = ?, updated_at = ? WHERE id = ?'
    ).run(newStatus, newCongestion, newCondition, updated_at, id);

    const record = db.prepare('SELECT * FROM traffic WHERE id = ?').get(id);

    await produceEvent(TOPICS.TRAFFIC_STATUS_UPDATED, {
      id, city: record.city, zone: record.zone, status: newStatus, congestion_level: newCongestion,
    });

    if (newCongestion >= 70) {
      await produceEvent(TOPICS.TRAFFIC_JAM_DETECTED, {
        id, city: record.city, zone: record.zone, congestion_level: newCongestion,
      });
    }

    callback(null, rowToTraffic(record));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function deleteTraffic(call, callback) {
  try {
    const result = db.prepare('DELETE FROM traffic WHERE id = ?').run(call.request.id);
    if (result.changes === 0) return callback({ code: 5, message: 'Traffic record not found' });
    callback(null, { success: true, message: 'Traffic record deleted' });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function rowToTraffic(row) {
  return {
    id: row.id,
    city: row.city,
    zone: row.zone,
    status: row.status,
    congestion_level: row.congestion_level,
    road_condition: row.road_condition,
    updated_at: row.updated_at,
  };
}

module.exports = { getAllTraffic, getTrafficById, createTraffic, updateTraffic, deleteTraffic };
