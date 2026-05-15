require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { initDb } = require('./db');
const handlers = require('./handlers');
const { initProducer } = require('./kafka/producer');
const { initConsumer } = require('./kafka/consumer');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/parking.proto');
const GRPC_PORT = process.env.GRPC_PORT || 50052;

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).parking;

async function main() {
  await initDb();
  await initProducer();
  await initConsumer();

  const server = new grpc.Server();
  server.addService(proto.ParkingService.service, {
    GetAllParkings: handlers.getAllParkings,
    GetParkingById: handlers.getParkingById,
    CreateParking: handlers.createParking,
    UpdateParking: handlers.updateParking,
    DeleteParking: handlers.deleteParking,
  });

  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Parking Service gRPC running on port ${port}`);
  });
}

main().catch(console.error);
