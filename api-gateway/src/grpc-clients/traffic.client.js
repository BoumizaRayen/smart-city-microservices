const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const config = require('../config/config');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/traffic.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).traffic;

const client = new proto.TrafficService(config.grpc.traffic, grpc.credentials.createInsecure());

function promisify(method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

module.exports = {
  getAllTraffic: (city) => promisify('GetAllTraffic', { city: city || '' }),
  getTrafficById: (id) => promisify('GetTrafficById', { id }),
  createTraffic: (data) => promisify('CreateTraffic', data),
  updateTraffic: (data) => promisify('UpdateTraffic', data),
  deleteTraffic: (id) => promisify('DeleteTraffic', { id }),
};
