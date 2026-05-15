const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const config = require('../config/config');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/weather.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).weather;

const client = new proto.WeatherService(config.grpc.weather, grpc.credentials.createInsecure());

function promisify(method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

module.exports = {
  getAllWeather: (city) => promisify('GetAllWeather', { city: city || '' }),
  getWeatherById: (id) => promisify('GetWeatherById', { id }),
  createWeather: (data) => promisify('CreateWeather', data),
  updateWeather: (data) => promisify('UpdateWeather', data),
  deleteWeather: (id) => promisify('DeleteWeather', { id }),
};
