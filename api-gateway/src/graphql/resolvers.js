const trafficClient = require('../grpc-clients/traffic.client');
const parkingClient = require('../grpc-clients/parking.client');
const incidentClient = require('../grpc-clients/incident.client');
const weatherClient = require('../grpc-clients/weather.client');
const notificationClient = require('../grpc-clients/notification.client');

const resolvers = {
  Query: {
    trafficStatus: async (_, { city }) => {
      try {
        const result = await trafficClient.getAllTraffic(city);
        return result.traffic || [];
      } catch (err) {
        console.error('[GraphQL] trafficStatus error:', err.message);
        return [];
      }
    },

    availableParkings: async (_, { city }) => {
      try {
        const result = await parkingClient.getAllParkings(city);
        return (result.parkings || []).filter((p) => !p.is_full);
      } catch (err) {
        console.error('[GraphQL] availableParkings error:', err.message);
        return [];
      }
    },

    activeIncidents: async (_, { city }) => {
      try {
        const result = await incidentClient.getAllIncidents(city);
        return (result.incidents || []).filter((i) => i.status === 'ACTIVE');
      } catch (err) {
        console.error('[GraphQL] activeIncidents error:', err.message);
        return [];
      }
    },

    weatherStatus: async (_, { city }) => {
      try {
        const result = await weatherClient.getAllWeather(city);
        const weather = result.weather || [];
        return weather.length > 0 ? weather[weather.length - 1] : null;
      } catch (err) {
        console.error('[GraphQL] weatherStatus error:', err.message);
        return null;
      }
    },

    notifications: async (_, { city }) => {
      try {
        const result = await notificationClient.getAllNotifications(city);
        return result.notifications || [];
      } catch (err) {
        console.error('[GraphQL] notifications error:', err.message);
        return [];
      }
    },

    dashboard: async (_, { city }) => {
      const [trafficResult, parkingResult, incidentResult, weatherResult, notifResult] = await Promise.allSettled([
        trafficClient.getAllTraffic(city),
        parkingClient.getAllParkings(city),
        incidentClient.getAllIncidents(city),
        weatherClient.getAllWeather(city),
        notificationClient.getAllNotifications(city),
      ]);

      const traffic = trafficResult.status === 'fulfilled' ? trafficResult.value.traffic || [] : [];
      const parkings = parkingResult.status === 'fulfilled' ? parkingResult.value.parkings || [] : [];
      const incidents = incidentResult.status === 'fulfilled' ? incidentResult.value.incidents || [] : [];
      const weatherList = weatherResult.status === 'fulfilled' ? weatherResult.value.weather || [] : [];
      const notifications = notifResult.status === 'fulfilled' ? notifResult.value.notifications || [] : [];

      return {
        traffic,
        parkings,
        incidents: incidents.filter((i) => i.status === 'ACTIVE'),
        weather: weatherList.length > 0 ? weatherList[weatherList.length - 1] : null,
        notifications,
      };
    },
  },
};

module.exports = { resolvers };
