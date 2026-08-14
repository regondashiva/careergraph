import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';
import fs from 'fs';
import path from 'path';

// Helper to load .env.local or .env if running outside Next.js
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = vals.join('=').trim();
          }
        }
      });
    }
  }
}
loadEnv();

// Environment Variable Configuration
const URI = process.env.COGNODB_URI || 'bolt://localhost:7687';
const USER = process.env.COGNODB_USERNAME || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD || 'cognodb_secret_password';

// Global Singleton to handle Next.js hot module reloads in development
declare global {
  var _cognodbDriver: Driver | undefined;
}

export function getDriver(): Driver {
  if (!global._cognodbDriver) {
    global._cognodbDriver = neo4j.driver(
      URI,
      neo4j.auth.basic(USER, PASSWORD),
      {
        disableLosslessIntegers: true, // Auto-convert Neo4j Integers to standard JS numbers
        connectionTimeout: 5000,
      }
    );
  }
  return global._cognodbDriver;
}

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  let session: Session | null = null;
  try {
    const driver = getDriver();
    session = driver.session();
    const result = await session.run('RETURN 1 AS test');
    const record = result.records[0];
    const isOk = record && record.get('test') === 1;
    return { healthy: isOk };
  } catch (err: any) {
    return {
      healthy: false,
      error: err?.message || 'Failed to connect to CognoDB / Bolt server',
    };
  } finally {
    if (session) {
      await session.close();
    }
  }
}

export async function runQuery<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result: QueryResult = await session.run(cypher, params);
    return result.records.map((record) => {
      const keys = record.keys;
      if (keys.length === 1) {
        const val = record.get(keys[0]);
        return sanitizeNeo4jValue(val);
      }

      const obj: Record<string, any> = {};
      keys.forEach((key: any) => {
        obj[String(key)] = sanitizeNeo4jValue(record.get(key));
      });
      return obj as T;
    });
  } catch (error: any) {
    console.error(`[CognoDB Cypher Error]:`, error.message, '\nQuery:', cypher, '\nParams:', params);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Sanitizes Neo4j Node, Relationship, Integer, and Date types into clean JavaScript objects
 */
export function sanitizeNeo4jValue(val: any): any {
  if (val === null || val === undefined) return null;

  // Handle Neo4j Integers
  if (typeof val === 'object' && val.low !== undefined && val.high !== undefined) {
    return val.toNumber ? val.toNumber() : val.low;
  }

  // Handle Neo4j Nodes
  if (typeof val === 'object' && val.labels && val.properties) {
    return {
      _id: val.identity ? (val.identity.toNumber ? val.identity.toNumber() : val.identity) : val.elementId,
      _labels: val.labels,
      ...val.properties,
    };
  }

  // Handle Neo4j Relationships
  if (typeof val === 'object' && val.type && val.properties) {
    return {
      _id: val.identity ? (val.identity.toNumber ? val.identity.toNumber() : val.identity) : val.elementId,
      _type: val.type,
      ...val.properties,
    };
  }

  // Handle Array of values
  if (Array.isArray(val)) {
    return val.map(sanitizeNeo4jValue);
  }

  // Handle nested standard objects
  if (typeof val === 'object' && val.constructor === Object) {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = sanitizeNeo4jValue(val[key]);
    }
    return cleaned;
  }

  return val;
}
