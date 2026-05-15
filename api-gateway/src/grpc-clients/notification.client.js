const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const config = require('../config/config');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/notification.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).notification;

const client = new proto.NotificationService(config.grpc.notification, grpc.credentials.createInsecure());

function promisify(method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

module.exports = {
  getAllNotifications: (city) => promisify('GetAllNotifications', { city: city || '' }),
  getNotificationById: (id) => promisify('GetNotificationById', { id }),
  deleteNotification: (id) => promisify('DeleteNotification', { id }),
};
