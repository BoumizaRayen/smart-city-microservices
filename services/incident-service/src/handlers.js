const { v4: uuidv4 } = require('uuid');
const { db } = require('./db');
const { produceEvent } = require('./kafka/producer');
const { TOPICS } = require('../../../kafka/kafkaClient');

function getAllIncidents(call, callback) {
  try {
    const { city } = call.request;
    const rows = city
      ? db.prepare("SELECT * FROM incidents WHERE city = ?").all(city)
      : db.prepare('SELECT * FROM incidents').all();
    callback(null, { incidents: rows.map(rowToIncident) });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function getIncidentById(call, callback) {
  try {
    const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(call.request.id);
    if (!row) return callback({ code: 5, message: 'Incident not found' });
    callback(null, rowToIncident(row));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function createIncident(call, callback) {
  try {
    const { city, zone, type, severity, description } = call.request;
    if (!city || !zone) return callback({ code: 3, message: 'city and zone are required' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const finalType = type || 'ACCIDENT';
    const finalSeverity = severity || 'MEDIUM';

    db.prepare(
      'INSERT INTO incidents (id, city, zone, type, severity, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, city, zone, finalType, finalSeverity, description || '', 'ACTIVE', now, now);

    const record = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);

    await produceEvent(TOPICS.INCIDENT_DETECTED, {
      id, city, zone, type: finalType, severity: finalSeverity, description: description || '',
    });

    callback(null, rowToIncident(record));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function updateIncident(call, callback) {
  try {
    const { id, status, severity, description } = call.request;
    const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!existing) return callback({ code: 5, message: 'Incident not found' });

    const updated_at = new Date().toISOString();
    const newStatus = status || existing.status;
    const newSeverity = severity || existing.severity;
    const newDescription = description || existing.description;

    db.prepare(
      'UPDATE incidents SET status = ?, severity = ?, description = ?, updated_at = ? WHERE id = ?'
    ).run(newStatus, newSeverity, newDescription, updated_at, id);

    const record = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);

    if (newStatus === 'RESOLVED') {
      await produceEvent(TOPICS.INCIDENT_RESOLVED, {
        id, city: record.city, zone: record.zone, type: record.type,
      });
    }

    callback(null, rowToIncident(record));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function deleteIncident(call, callback) {
  try {
    const result = db.prepare('DELETE FROM incidents WHERE id = ?').run(call.request.id);
    if (result.changes === 0) return callback({ code: 5, message: 'Incident not found' });
    callback(null, { success: true, message: 'Incident deleted' });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function rowToIncident(row) {
  return {
    id: row.id, city: row.city, zone: row.zone, type: row.type,
    severity: row.severity, description: row.description, status: row.status,
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

module.exports = { getAllIncidents, getIncidentById, createIncident, updateIncident, deleteIncident };
