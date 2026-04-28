// import apiClient from '../../../../../utils/axiosConfig';

import apiClient from "../../../../utils/axiosConfig.js";

export const CLASSES_BACKEND_LIVE = false;
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/admin/classes
 * Fetches the computed/generated school-wide classes taxonomy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function getSchoolClasses() {
  console.log('📡 GET /api/admin/classes');
  console.log('📦 Expected response shape:', {
    success: true,
    data: { 
      classes: [{ id: 'string', name: 'string', baseLevel: 'string', arm: 'string | null' }]
    },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/classes');
    return data;
  }

  await delay();
  return { success: true, data: { classes: [] } };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/admin/classes/bulk
 * Saves an entire generated Matrix configuration of base classes and arms.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function bulkCreateClasses(payload) {
  // payload: { classes: [{ baseLevel: 'SS 1', arm: 'Science', name: 'SS 1 Science' }, ...] }
  console.log('📡 POST /api/admin/classes/bulk', payload);
  console.log('📦 Expected response form:', { 
    success: true, 
    data: { 
      classes: [{ id: 'db_generated_string', baseLevel: 'SS 1', arm: 'Science', name: 'SS 1 Science' }] 
    } 
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/classes/bulk', payload);
    return data;
  }

  await delay(800);
  // Mock DB generation
  const generated = payload.classes.map((c, i) => ({
    id: `class_${Date.now()}_${i}`,
    ...c
  }));

  return { success: true, data: { classes: generated } };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELETE /api/admin/classes/:id
 * Removes a generated class subset entirely.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function deleteClass(classId) {
  console.log(`📡 DELETE /api/admin/classes/${classId}`);

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/admin/classes/${classId}`);
    return data;
  }

  await delay();
  return { success: true };
}
