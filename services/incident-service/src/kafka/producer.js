const { kafka } = require('../../../../kafka/kafkaClient');

let producer = null;

async function initProducer() {
  producer = kafka.producer();
  await producer.connect();
  console.log('Incident Kafka producer connected');
}

async function produceEvent(topic, data) {
  if (!producer) return;
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify({ ...data, timestamp: new Date().toISOString() }) }],
    });
    console.log(`[Incident] Produced event to ${topic}:`, data);
  } catch (err) {
    console.error(`Kafka produce error [${topic}]:`, err.message);
  }
}

module.exports = { initProducer, produceEvent };
