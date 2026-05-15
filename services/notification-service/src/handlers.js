const { getCollection } = require('./db');

async function getAllNotifications(call, callback) {
  try {
    const collection = getCollection();
    const { city } = call.request;
    const query = city
      ? collection.find({ selector: { city } })
      : collection.find();
    const docs = await query.exec();
    callback(null, { notifications: docs.map(docToNotification) });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function getNotificationById(call, callback) {
  try {
    const collection = getCollection();
    const doc = await collection.findOne(call.request.id).exec();
    if (!doc) return callback({ code: 5, message: 'Notification not found' });
    callback(null, docToNotification(doc));
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

async function deleteNotification(call, callback) {
  try {
    const collection = getCollection();
    const doc = await collection.findOne(call.request.id).exec();
    if (!doc) return callback({ code: 5, message: 'Notification not found' });
    await doc.remove();
    callback(null, { success: true, message: 'Notification deleted' });
  } catch (err) {
    callback({ code: 13, message: err.message });
  }
}

function docToNotification(doc) {
  const d = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: d.id, city: d.city, type: d.type, title: d.title,
    message: d.message, source_event: d.source_event, created_at: d.created_at,
  };
}

module.exports = { getAllNotifications, getNotificationById, deleteNotification };
