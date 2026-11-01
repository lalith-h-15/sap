import { env } from '../../config/env.js';
import { EmployeeContext } from '../../models/EmployeeContext.js';

export async function getEmployeeContext(employeeId) {
  if (env.academiaApiBaseUrl && env.academiaServiceToken) {
    const url = `${env.academiaApiBaseUrl.replace(/\/$/, '')}/api/orchestrator/employees/${encodeURIComponent(employeeId)}/context`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${env.academiaServiceToken}`, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`AcademiaConnect returned ${response.status}`);
    const payload = await response.json();
    return payload.data || payload.employee || payload;
  }
  return EmployeeContext.findOne({ externalEmployeeId: String(employeeId) }).lean();
}
