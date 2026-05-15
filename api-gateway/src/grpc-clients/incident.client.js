const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const config = require('../config/config');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/incident.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).incident;

const client = new proto.IncidentService(config.grpc.incident, grpc.credentials.createInsecure());

function promisify(method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

module.exports = {
  getAllIncidents: (city) => promisify('GetAllIncidents', { city: city || '' }),
  getIncidentById: (id) => promisify('GetIncidentById', { id }),
  createIncident: (data) => promisify('CreateIncident', data),
  updateIncident: (data) => promisify('UpdateIncident', data),
  deleteIncident: (id) => promisify('DeleteIncident', { id }),
};
