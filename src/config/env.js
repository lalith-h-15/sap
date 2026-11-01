import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
dotenv.config();

const split = (value = '') =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5100),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/career_orchestrator',
  corsOrigins: split(process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000'),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtIssuer: process.env.JWT_ISSUER || 'academiaconnect',
  jwtAudience: process.env.JWT_AUDIENCE || 'career-orchestrator',
  academiaApiBaseUrl: process.env.ACADEMIA_API_BASE_URL || '',
  academiaServiceToken: process.env.ACADEMIA_SERVICE_TOKEN || '',
  aiProvider: process.env.AI_PROVIDER || 'rules',
  sapGenAiEndpoint: process.env.SAP_GENAI_ENDPOINT || '',
  sapGenAiApiKey: process.env.SAP_GENAI_API_KEY || ''
};

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}