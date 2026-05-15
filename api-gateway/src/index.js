require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
const config = require('./config/config');

// Routes
const trafficRoutes = require('./routes/traffic.routes');
const parkingRoutes = require('./routes/parking.routes');
const incidentRoutes = require('./routes/incident.routes');
const weatherRoutes = require('./routes/weather.routes');
const notificationRoutes = require('./routes/notification.routes');

async function main() {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'API Gateway', timestamp: new Date().toISOString() });
  });

  // REST routes
  app.use('/api/traffic', trafficRoutes);
  app.use('/api/parkings', parkingRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/notifications', notificationRoutes);

  // GraphQL
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req }) => ({ req }),
  }));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  app.listen(config.port, () => {
    console.log(`\nSmart City API Gateway running at:`);
    console.log(`   REST:    http://localhost:${config.port}/api`);
    console.log(`   GraphQL: http://localhost:${config.port}/graphql`);
    console.log(`   Health:  http://localhost:${config.port}/health\n`);
  });
}

main().catch(console.error);
