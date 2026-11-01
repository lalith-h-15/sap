import { SignJWT } from 'jose';
import { env } from '../src/config/env.js';

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is missing');
}

const secret = new TextEncoder().encode(env.jwtSecret);

const token = await new SignJWT({
  role: 'employee',
  email: 'anika.demo@example.com'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject('demo-anika-001')
  .setIssuer(env.jwtIssuer)
  .setAudience(env.jwtAudience)
  .setIssuedAt()
  .setExpirationTime('30m')
  .sign(secret);

console.log(token);
