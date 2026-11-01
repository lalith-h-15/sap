import mongoose from 'mongoose';
const orchestratorRunSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  requestedBy: { type: String, required: true },
  roleId: { type: String, required: true },
  status: { type: String, enum: ['completed', 'pending_review', 'approved', 'rejected'], default: 'completed' },
  inputSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  humanReview: {
    decision: { type: String, enum: ['pending', 'approved', 'rejected', 'changes_requested'], default: 'pending' },
    comment: String,
    reviewedBy: String,
    reviewedAt: Date
  }
}, { timestamps: true, versionKey: false });
export const OrchestratorRun = mongoose.model('OrchestratorRun', orchestratorRunSchema);
