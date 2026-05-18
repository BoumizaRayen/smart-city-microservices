require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { initDb } = require('./db');
const handlers = require('./handlers');
const { initConsumer } = require('./kafka/consumer');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/notification.proto');
const GRPC_PORT = process.env.GRPC_PORT || 50055;

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).notification;

async function main() {
  await initDb();
  await initConsumer();

  const server = new grpc.Server();
  server.addService(proto.NotificationService.service, {
    GetAllNotifications: handlers.getAllNotifications,
    GetNotificationById: handlers.getNotificationById,
    DeleteNotification: handlers.deleteNotification,
  });

  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Notification Service gRPC running on port ${port}`);
  });
}

main().catch(console.error);
