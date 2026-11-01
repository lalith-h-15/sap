import mongoose from 'mongoose';

// One row = "this Career Orchestrator user is THIS MeritLens employee".
// Matching by name is never allowed; only explicit IDs are stored here.
const identityMappingSchema = new mongoose.Schema({
  careerOrchestratorUserId: { type: String, required: true, unique: true, index: true },
  canonicalEmployeeId: { type: String, required: true, unique: true },
  meritLensEmployeeId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending_verification', 'verified'], default: 'pending_verification' },
  verifiedBy: String,
  note: String
}, { timestamps: true, versionKey: false });

export const IdentityMapping = mongoose.model('IdentityMapping', identityMappingSchema);
