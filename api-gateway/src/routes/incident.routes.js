const express = require('express');
const router = express.Router();
const incidentClient = require('../grpc-clients/incident.client');

router.get('/', async (req, res) => {
  try {
    const result = await incidentClient.getAllIncidents(req.query.city);
    res.json({ success: true, data: result.incidents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await incidentClient.getIncidentById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await incidentClient.createIncident(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 3 ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await incidentClient.updateIncident({ id: req.params.id, ...req.body });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await incidentClient.deleteIncident(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
