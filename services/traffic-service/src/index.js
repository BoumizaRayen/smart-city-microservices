require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { initDb } = require('./db');
const handlers = require('./handlers');
const { initProducer } = require('./kafka/producer');
const { initConsumer } = require('./kafka/consumer');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/traffic.proto');
const GRPC_PORT = process.env.GRPC_PORT || 50051;

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).traffic;

async function main() {
  initDb();
  await initProducer();
  await initConsumer();

  const server = new grpc.Server();
  server.addService(proto.TrafficService.service, {
    GetAllTraffic: handlers.getAllTraffic,
    GetTrafficById: handlers.getTrafficById,
    CreateTraffic: handlers.createTraffic,
    UpdateTraffic: handlers.updateTraffic,
    DeleteTraffic: handlers.deleteTraffic,
  });

  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Traffic Service gRPC running on port ${port}`);
  });
}

main().catch(console.error);
