const { v4: uuidv4 } = require('uuid');
const { db } = require('./db');
const { produceEvent } = require('./kafka/producer');
const { TOPICS } = require('../../../kafka/kafkaClient');

function isDangerous(wind_speed, rainfall, condition) {
  return wind_speed > 80 || rainfall > 50 || ['STORM', 'FOG'].includes(condition);
}

function getAllWeather(call, callback) {
  try {
    const { city } = call.request;
    const rows = city
      ? db.prepare('SELECT * FROM weather WHERE city = ?').all(city)
      : db.prepare('SELECT * FROM weather').all();
    callback(null, { weather: rows.map(rowToWeather) });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function getWeatherById(call, callback) {
  try {
    const row = db.prepare('SELECT * FROM weather WHERE id = ?').get(call.request.id);
    if (!row) return callback({ code: 5, message: 'Weather record not found' });
    callback(null, rowToWeather(row));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function createWeather(call, callback) {
  try {
    const { city, temperature, wind_speed, rainfall, condition } = call.request;
    if (!city) return callback({ code: 3, message: 'city is required' });

    const id = uuidv4();
    const updated_at = new Date().toISOString();
    const dangerous = isDangerous(wind_speed, rainfall, condition);

    db.prepare(
      'INSERT INTO weather (id, city, temperature, wind_speed, rainfall, condition, is_dangerous, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, city, temperature || 20.0, wind_speed || 0.0, rainfall || 0.0, condition || 'CLEAR', dangerous ? 1 : 0, updated_at);

    const record = db.prepare('SELECT * FROM weather WHERE id = ?').get(id);

    await produceEvent(TOPICS.WEATHER_UPDATED, { id, city, condition, wind_speed, rainfall });

    if (dangerous) {
      await produceEvent(TOPICS.WEATHER_DANGEROUS, {
        id, city, condition: condition || 'CLEAR', wind_speed: wind_speed || 0, rainfall: rainfall || 0,
      });
      console.log(`[Weather] Dangerous conditions detected in ${city}`);
    }

    callback(null, rowToWeather(record));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function updateWeather(call, callback) {
  try {
    const { id, temperature, wind_speed, rainfall, condition } = call.request;
    const existing = db.prepare('SELECT * FROM weather WHERE id = ?').get(id);
    if (!existing) return callback({ code: 5, message: 'Weather record not found' });

    const updated_at = new Date().toISOString();
    const newTemp = temperature !== undefined ? temperature : existing.temperature;
    const newWind = wind_speed !== undefined ? wind_speed : existing.wind_speed;
    const newRain = rainfall !== undefined ? rainfall : existing.rainfall;
    const newCondition = condition || existing.condition;
    const dangerous = isDangerous(newWind, newRain, newCondition);

    db.prepare(
      'UPDATE weather SET temperature = ?, wind_speed = ?, rainfall = ?, condition = ?, is_dangerous = ?, updated_at = ? WHERE id = ?'
    ).run(newTemp, newWind, newRain, newCondition, dangerous ? 1 : 0, updated_at, id);

    const record = db.prepare('SELECT * FROM weather WHERE id = ?').get(id);

    await produceEvent(TOPICS.WEATHER_UPDATED, {
      id, city: record.city, condition: newCondition, wind_speed: newWind, rainfall: newRain,
    });

    if (dangerous && !existing.is_dangerous) {
      await produceEvent(TOPICS.WEATHER_DANGEROUS, {
        id, city: record.city, condition: newCondition, wind_speed: newWind, rainfall: newRain,
      });
    }

    callback(null, rowToWeather(record));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function deleteWeather(call, callback) {
  try {
    const result = db.prepare('DELETE FROM weather WHERE id = ?').run(call.request.id);
    if (result.changes === 0) return callback({ code: 5, message: 'Weather record not found' });
    callback(null, { success: true, message: 'Weather record deleted' });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function rowToWeather(row) {
  return {
    id: row.id, city: row.city, temperature: row.temperature,
    wind_speed: row.wind_speed, rainfall: row.rainfall, condition: row.condition,
    is_dangerous: row.is_dangerous === 1, updated_at: row.updated_at,
  };
}

module.exports = { getAllWeather, getWeatherById, createWeather, updateWeather, deleteWeather };
