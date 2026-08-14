import neo4j from 'neo4j-driver';

const URI = process.env.COGNODB_URI || 'bolt://localhost:7687';
const USER = process.env.COGNODB_USERNAME || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD || 'cognodb_secret_password';

async function resetGraph() {
  console.log(`Connecting to ${URI} to reset CognoDB graph...`);
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Graph database cleared safely.');
  } catch (err: any) {
    console.error('❌ Failed to reset graph:', err.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

resetGraph();
