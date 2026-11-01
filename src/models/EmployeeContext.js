import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  evidenceLevel: { type: String, enum: ['self_declared', 'assessed', 'demonstrated'], default: 'self_declared' },
  sourceIds: [{ type: String }]
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  skills: [{ type: String }],
  score: { type: Number, min: 0, max: 100 },
  completedAt: Date,
  status: { type: String, enum: ['completed', 'in_progress', 'pending'], default: 'completed' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  skills: [{ type: String }],
  evidenceId: String,
  verificationStatus: { type: String, enum: ['submitted', 'verified', 'unverified'], default: 'submitted' },
  completedAt: Date
}, { _id: false });

const employeeContextSchema = new mongoose.Schema({
  externalEmployeeId: { type: String, required: true, unique: true, index: true },
  source: { type: String, enum: ['academiaconnect', 'demo', 'manual'], default: 'demo' },
  name: { type: String, required: true },
  headline: String,
  careerGoal: String,
  skills: [skillSchema],
  assessments: [assessmentSchema],
  projects: [projectSchema],
  learningRecords: [{ title: String, skills: [String], status: String, completedAt: Date }],
  updatedBy: String
}, { timestamps: true, versionKey: false });

export const EmployeeContext = mongoose.model('EmployeeContext', employeeContextSchema);
