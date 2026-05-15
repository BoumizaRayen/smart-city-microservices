const express = require('express');
const router = express.Router();
const parkingClient = require('../grpc-clients/parking.client');

router.get('/', async (req, res) => {
  try {
    const result = await parkingClient.getAllParkings(req.query.city);
    res.json({ success: true, data: result.parkings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await parkingClient.getParkingById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await parkingClient.createParking(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 3 ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await parkingClient.updateParking({ id: req.params.id, ...req.body });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await parkingClient.deleteParking(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
