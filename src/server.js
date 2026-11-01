import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

try {
  await connectDatabase();
  app.listen(env.port, () => console.log(`Career Orchestrator API listening on http://localhost:${env.port}`));
} catch (error) {
  console.error('Failed to start API:', error.message);
  process.exit(1);
}
