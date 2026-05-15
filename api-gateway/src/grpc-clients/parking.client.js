const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const config = require('../config/config');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/parking.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).parking;

const client = new proto.ParkingService(config.grpc.parking, grpc.credentials.createInsecure());

function promisify(method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

module.exports = {
  getAllParkings: (city) => promisify('GetAllParkings', { city: city || '' }),
  getParkingById: (id) => promisify('GetParkingById', { id }),
  createParking: (data) => promisify('CreateParking', data),
  updateParking: (data) => promisify('UpdateParking', data),
  deleteParking: (id) => promisify('DeleteParking', { id }),
};
