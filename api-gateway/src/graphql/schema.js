const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Traffic {
    id: ID!
    city: String!
    zone: String!
    status: String!
    congestion_level: Int!
    road_condition: String!
    updated_at: String!
  }

  type Parking {
    id: ID!
    name: String!
    city: String!
    zone: String!
    total_spots: Int!
    available_spots: Int!
    is_full: Boolean!
    updated_at: String!
  }

  type Incident {
    id: ID!
    city: String!
    zone: String!
    type: String!
    severity: String!
    description: String
    status: String!
    created_at: String!
    updated_at: String!
  }

  type Weather {
    id: ID!
    city: String!
    temperature: Float!
    wind_speed: Float!
    rainfall: Float!
    condition: String!
    is_dangerous: Boolean!
    updated_at: String!
  }

  type Notification {
    id: ID!
    city: String!
    type: String!
    title: String!
    message: String!
    source_event: String!
    created_at: String!
  }

  type Dashboard {
    traffic: [Traffic]
    parkings: [Parking]
    incidents: [Incident]
    weather: Weather
    notifications: [Notification]
  }

  type Query {
    dashboard(city: String!): Dashboard
    trafficStatus(city: String!): [Traffic]
    availableParkings(city: String!): [Parking]
    activeIncidents(city: String!): [Incident]
    weatherStatus(city: String!): Weather
    notifications(city: String!): [Notification]
  }
`;

module.exports = { typeDefs };
