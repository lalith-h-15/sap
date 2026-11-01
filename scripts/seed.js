import { connectDatabase } from '../src/config/database.js';
import { EmployeeContext } from '../src/models/EmployeeContext.js';
import { JobRole } from '../src/models/JobRole.js';

const roles = [
  { roleId: 'junior-fullstack', title: 'Junior Full-Stack Developer', category: 'Software Engineering', description: 'Build and maintain web applications across frontend and backend.', experience: 'Entry level', skills: [
    { name: 'JavaScript', importance: 'essential', minimumLevel: 'intermediate' }, { name: 'React', importance: 'essential', minimumLevel: 'beginner' }, { name: 'Node.js', importance: 'essential', minimumLevel: 'beginner' }, { name: 'SQL', importance: 'essential', minimumLevel: 'beginner' }, { name: 'Testing', importance: 'preferred', minimumLevel: 'beginner' }, { name: 'Git', importance: 'preferred', minimumLevel: 'beginner' }
  ] },
  { roleId: 'data-analyst', title: 'Junior Data Analyst', category: 'Data', description: 'Analyse structured data and communicate actionable findings.', experience: 'Entry level', skills: [
    { name: 'SQL', importance: 'essential', minimumLevel: 'intermediate' }, { name: 'Python', importance: 'essential', minimumLevel: 'beginner' }, { name: 'Data Visualisation', importance: 'essential', minimumLevel: 'beginner' }, { name: 'Statistics', importance: 'preferred', minimumLevel: 'beginner' }, { name: 'Excel', importance: 'preferred', minimumLevel: 'beginner' }
  ] },
  { roleId: 'ml-intern', title: 'AI / Machine Learning Intern', category: 'AI and Data Science', description: 'Prepare datasets, build baseline models and evaluate model behaviour.', experience: 'Internship', skills: [
    { name: 'Python', importance: 'essential', minimumLevel: 'intermediate' }, { name: 'Statistics', importance: 'essential', minimumLevel: 'beginner' }, { name: 'Machine Learning', importance: 'essential', minimumLevel: 'beginner' }, { name: 'SQL', importance: 'preferred', minimumLevel: 'beginner' }, { name: 'Git', importance: 'preferred', minimumLevel: 'beginner' }
  ] }
];

const demoEmployee = {
  externalEmployeeId: 'demo-anika-001', source: 'demo', name: 'Anika Sharma', headline: 'Returning software developer', careerGoal: 'Junior Full-Stack Developer',
  skills: [
    { name: 'JavaScript', level: 'intermediate', evidenceLevel: 'assessed', sourceIds: ['ASSESS-JS-01'] },
    { name: 'Python', level: 'beginner', evidenceLevel: 'assessed', sourceIds: ['ASSESS-PY-01'] },
    { name: 'React', level: 'intermediate', evidenceLevel: 'demonstrated', sourceIds: ['PROJECT-REACT-01'] },
    { name: 'Node.js', level: 'beginner', evidenceLevel: 'self_declared' }
  ],
  assessments: [
    { title: 'JavaScript Fundamentals Assessment', skills: ['JavaScript'], score: 82, status: 'completed', completedAt: new Date('2026-10-20') },
    { title: 'Python Basics Assessment', skills: ['Python'], score: 74, status: 'completed', completedAt: new Date('2026-10-22') }
  ],
  projects: [
    { title: 'Task Management Web App', description: 'Built a React application with API integration.', skills: ['React', 'JavaScript'], evidenceId: 'PROJECT-REACT-01', verificationStatus: 'verified', completedAt: new Date('2026-10-25') }
  ],
  learningRecords: [{ title: 'React Fundamentals', skills: ['React'], status: 'completed', completedAt: new Date('2026-10-24') }]
};

try {
  await connectDatabase();
  for (const role of roles) await JobRole.updateOne({ roleId: role.roleId }, { $set: role }, { upsert: true });
  await EmployeeContext.updateOne({ externalEmployeeId: demoEmployee.externalEmployeeId }, { $set: demoEmployee }, { upsert: true });
  console.log(`Seeded ${roles.length} roles and demo employee ${demoEmployee.externalEmployeeId}`);
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
