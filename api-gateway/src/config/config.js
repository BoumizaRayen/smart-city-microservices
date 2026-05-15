module.exports = {
  port: process.env.PORT || 3000,
  grpc: {
    traffic: process.env.TRAFFIC_GRPC_HOST || 'localhost:50051',
    parking: process.env.PARKING_GRPC_HOST || 'localhost:50052',
    incident: process.env.INCIDENT_GRPC_HOST || 'localhost:50053',
    weather: process.env.WEATHER_GRPC_HOST || 'localhost:50054',
    notification: process.env.NOTIFICATION_GRPC_HOST || 'localhost:50055',
  },
};
