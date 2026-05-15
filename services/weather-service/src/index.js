require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { initDb } = require('./db');
const handlers = require('./handlers');
const { initProducer } = require('./kafka/producer');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/weather.proto');
const GRPC_PORT = process.env.GRPC_PORT || 50054;

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).weather;

async function main() {
  initDb();
  await initProducer();

  const server = new grpc.Server();
  server.addService(proto.WeatherService.service, {
    GetAllWeather: handlers.getAllWeather,
    GetWeatherById: handlers.getWeatherById,
    CreateWeather: handlers.createWeather,
    UpdateWeather: handlers.updateWeather,
    DeleteWeather: handlers.deleteWeather,
  });

  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Weather Service gRPC running on port ${port}`);
  });
}

main().catch(console.error);
