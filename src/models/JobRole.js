import mongoose from 'mongoose';
const requiredSkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minimumLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  importance: { type: String, enum: ['essential', 'preferred'], default: 'essential' }
}, { _id: false });
const jobRoleSchema = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: String,
  category: String,
  skills: [requiredSkillSchema],
  experience: String,
  source: { type: String, default: 'curated_demo_catalogue' },
  active: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });
export const JobRole = mongoose.model('JobRole', jobRoleSchema);
