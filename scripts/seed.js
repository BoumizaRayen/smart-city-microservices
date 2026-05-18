/**
 * Seed script - populates all services with test data via REST API
 * Run: node scripts/seed.js
 * Make sure the API Gateway and all services are running first!
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function seed() {
  console.log('Starting seed...\n');

  // Seed Traffic
  console.log('Seeding traffic data...');
  const trafficData = [
    { city: 'Tunis', zone: 'Centre-Ville', status: 'CONGESTED', congestion_level: 80, road_condition: 'NORMAL' },
    { city: 'Tunis', zone: 'La Marsa', status: 'FREE', congestion_level: 10, road_condition: 'NORMAL' },
    { city: 'Tunis', zone: 'Bab Bhar', status: 'MODERATE', congestion_level: 45, road_condition: 'WET' },
    { city: 'Sfax', zone: 'Medina', status: 'FREE', congestion_level: 20, road_condition: 'NORMAL' },
  ];
  for (const t of trafficData) {
    await request('POST', '/api/traffic', t);
    console.log(`  Traffic: ${t.zone} - ${t.status}`);
  }

  // Seed Parkings
  console.log('\nSeeding parking data...');
  const parkingData = [
    { name: 'Parking Republique', city: 'Tunis', zone: 'Centre-Ville', total_spots: 200, available_spots: 15 },
    { name: 'Parking Belvedere', city: 'Tunis', zone: 'Belvedere', total_spots: 150, available_spots: 80 },
    { name: 'Parking La Marsa', city: 'Tunis', zone: 'La Marsa', total_spots: 100, available_spots: 100 },
    { name: 'Parking Sfax Centre', city: 'Sfax', zone: 'Medina', total_spots: 120, available_spots: 0 },
  ];
  for (const p of parkingData) {
    await request('POST', '/api/parkings', p);
    console.log(`  Parking: ${p.name} - ${p.available_spots}/${p.total_spots} spots`);
  }

  // Seed Weather
  console.log('\nSeeding weather data...');
  const weatherData = [
    { city: 'Tunis', temperature: 22.5, wind_speed: 15, rainfall: 0, condition: 'CLEAR' },
    { city: 'Sfax', temperature: 25.0, wind_speed: 25, rainfall: 5, condition: 'CLOUDY' },
  ];
  for (const w of weatherData) {
    await request('POST', '/api/weather', w);
    console.log(`  Weather: ${w.city} - ${w.condition} ${w.temperature}C`);
  }

  // Seed Incidents
  console.log('\nSeeding incident data...');
  const incidentData = [
    { city: 'Tunis', zone: 'Centre-Ville', type: 'ACCIDENT', severity: 'HIGH', description: 'Multi-vehicle accident on Avenue Habib Bourguiba' },
    { city: 'Tunis', zone: 'Bab Bhar', type: 'ROAD_BLOCKED', severity: 'MEDIUM', description: 'Road maintenance works blocking 2 lanes' },
  ];
  for (const i of incidentData) {
    await request('POST', '/api/incidents', i);
    console.log(`  Incident: ${i.type} in ${i.zone} - ${i.severity}`);
  }

  console.log('\nSeed complete! Check your services for data.\n');
  console.log('Test GraphQL dashboard query:');
  console.log(`  POST ${BASE_URL}/graphql`);
  console.log('  { "query": "{ dashboard(city: \\"Tunis\\") { traffic { zone status } parkings { name available_spots } incidents { type severity } weather { condition temperature } notifications { title } } }" }');
}

seed().catch((err) => {
  console.error('Seed error:', err.message);
  console.error('Make sure the API Gateway is running on port 3000!');
  process.exit(1);
});
