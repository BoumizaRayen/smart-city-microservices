const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'smart-city',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});

const TOPICS = {
  INCIDENT_DETECTED: 'incident.detected',
  INCIDENT_RESOLVED: 'incident.resolved',
  TRAFFIC_JAM_DETECTED: 'traffic.jam.detected',
  TRAFFIC_STATUS_UPDATED: 'traffic.status.updated',
  PARKING_FULL: 'parking.full',
  PARKING_AVAILABLE: 'parking.available',
  WEATHER_DANGEROUS: 'weather.dangerous',
  WEATHER_UPDATED: 'weather.updated',
  NOTIFICATION_CREATED: 'notification.created',
};

async function createTopics() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: Object.values(TOPICS).map((topic) => ({
      topic,
      numPartitions: 1,
      replicationFactor: 1,
    })),
  });
  await admin.disconnect();
  console.log('Kafka topics created');
}

module.exports = { kafka, TOPICS, createTopics };
