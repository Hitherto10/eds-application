import apiClient from "../../../../utils/axiosConfig.js";

export const SUBJECTS_BACKEND_LIVE = false;
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

/**
 * GET /api/admin/subjects
 * Fetches all created school-wide subjects.
 */
export async function getSchoolSubjects() {
  console.log('📡 GET /api/admin/subjects');
  console.log('📦 Expected response:', {
    success: true,
    data: { subjects: [{ id: 'string', name: 'string', code: 'string | null' }] },
  });

  if (SUBJECTS_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/subjects');
    return data;
  }

  await delay();
  return { success: true, data: { subjects: [] } };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/admin/subjects/bulk
 * Saves a batch of subjects to the system. Used mainly by hybrid setup wizard.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function bulkCreateSubjects(payload) {
  // payload: { subjects: [{ name: 'Mathematics', code: 'MTH' }, ...] }
  console.log('📡 POST /api/admin/subjects/bulk', payload);
  console.log('📦 Expected response form:', { 
    success: true, 
    data: { subjects: [{ id: 'db_generated_string', name: 'Mathematics', code: 'MTH' }] } 
  });

  if (SUBJECTS_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/subjects/bulk', payload);
    return data;
  }

  await delay(800);
  // Mock DB generation
  const generated = payload.subjects.map((s, i) => ({
    id: `subj_${Date.now()}_${i}`,
    ...s
  }));

  return { success: true, data: { subjects: generated } };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/admin/subjects
 * Manually add a single subject.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function createSubject(payload) {
  // payload: { name: 'string', code: 'string' }
  console.log('📡 POST /api/admin/subjects', payload);

  if (SUBJECTS_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/subjects', payload);
    return data;
  }

  await delay();
  return { success: true, data: { subject: { id: `subj_${Date.now()}`, ...payload } } };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELETE /api/admin/subjects/:id
 * Removes a subject from the school database.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function deleteSubject(subjectId) {
  console.log(`📡 DELETE /api/admin/subjects/${subjectId}`);

  if (SUBJECTS_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/admin/subjects/${subjectId}`);
    return data;
  }

  await delay();
  return { success: true };
}
