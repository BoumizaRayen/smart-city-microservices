const express = require('express');
const router = express.Router();
const notificationClient = require('../grpc-clients/notification.client');

router.get('/', async (req, res) => {
  try {
    const result = await notificationClient.getAllNotifications(req.query.city);
    res.json({ success: true, data: result.notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await notificationClient.getNotificationById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await notificationClient.deleteNotification(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
