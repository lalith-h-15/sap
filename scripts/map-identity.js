// Usage:
//   node scripts/map-identity.js <careerOrchestratorUserId> <meritLensEmployeeId> [canonicalEmployeeId] [--verified]
// Example:
//   node scripts/map-identity.js demo-anika-001 EMP-1001 --verified
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { IdentityMapping } from '../src/models/IdentityMapping.js';

const args = process.argv.slice(2);
const verified = args.includes('--verified');
const [careerId, meritLensId, canonicalArg] = args.filter((arg) => !arg.startsWith('--'));

if (!careerId || !meritLensId) {
  console.error('Usage: node scripts/map-identity.js <careerOrchestratorUserId> <meritLensEmployeeId> [canonicalEmployeeId] [--verified]');
  process.exit(1);
}

await connectDatabase();
const mapping = await IdentityMapping.findOneAndUpdate(
  { careerOrchestratorUserId: careerId },
  { $set: {
    careerOrchestratorUserId: careerId,
    canonicalEmployeeId: canonicalArg || careerId,
    meritLensEmployeeId: meritLensId,
    status: verified ? 'verified' : 'pending_verification',
    verifiedBy: verified ? (process.env.USERNAME || process.env.USER || 'cli') : undefined
  } },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
).lean();
console.log('Mapping saved:', { careerOrchestratorUserId: mapping.careerOrchestratorUserId, canonicalEmployeeId: mapping.canonicalEmployeeId, meritLensEmployeeId: mapping.meritLensEmployeeId, status: mapping.status });
await mongoose.disconnect();
