import { SignJWT } from 'jose';
import { env } from '../src/config/env.js';

const secret = new TextEncoder().encode(env.jwtSecret);

const token = await new SignJWT({
  role: 'manager',
  email: 'manager.demo@example.com'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject('demo-manager-001')
  .setIssuer(env.jwtIssuer)
  .setAudience(env.jwtAudience)
  .setIssuedAt()
  .setExpirationTime('30m')
  .sign(secret);

console.log(token);
