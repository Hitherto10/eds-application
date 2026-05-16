import apiClient from '../../../../utils/axiosConfig.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Class APIs  —  /api/academic/classes
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FEATURE FLAG:
 *   Set CLASSES_BACKEND_LIVE = true once the backend endpoints are deployed.
 *   All stubs below log the exact request shape so the backend developer has a
 *   clear specification to implement against.
 *
 * ID NORMALISATION:
 *   The live backend returns MongoDB `_id` fields.  The frontend state always
 *   uses `id` for consistency.  normalizeId() performs the mapping automatically
 *   when CLASSES_BACKEND_LIVE is true.  Mock responses already emit `id`.
 *
 * UNIFIED DELETE FORMAT  (matches newFeatures.md spec):
 *   deleteClasses() accepts a single string OR an array of strings.
 */

export const CLASSES_BACKEND_LIVE = true;

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ── ID normalisation helpers (live-mode only) ─────────────────────────────────
const normalizeId = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const { _id, ...rest } = obj;
  return _id ? { id: _id, _id, ...rest } : obj;
};
const normalizeList = (list) =>
  Array.isArray(list) ? list.map(normalizeId) : list;

// =============================================================================
// GET /api/academic/classes
// Returns all base class levels for the school.
// =============================================================================
export async function getSchoolClasses() {
  console.log('📡 GET /api/academic/classes');
  console.log('📦 Expected response shape:', {
    success: true,
    data: {
      classes: [{ _id: 'string', name: 'JSS1', level: 1, isActive: true }],
      total: 4,
    },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/academic/classes');
    if (data.success) data.data.classes = normalizeList(data.data.classes);
    return data;
  }

  await delay();
  return { success: true, data: { classes: [], total: 0 } };
}

// =============================================================================
// GET /api/academic/classes/:classId
// =============================================================================
export async function getClassById(classId) {
  console.log(`📡 GET /api/academic/classes/${classId}`);
  console.log('📦 Expected response shape:', {
    success: true,
    data: { _id: 'string', name: 'JSS1', level: 1, isActive: true },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/academic/classes/${classId}`);
    if (data.success) data.data = normalizeId(data.data);
    return data;
  }

  await delay();
  return {
    success: true,
    data: { id: classId, _id: classId, name: '', level: 1, isActive: true },
  };
}

// =============================================================================
// POST /api/academic/classes
// Creates one or more base class levels.
//
// Payload:
//   { classes: [{ name: 'JSS1', level: 1, description?: string }] }
//
// Response (201):
//   { success, message, data: { classes: [...], total, errors: [] } }
// =============================================================================
export async function createClasses(payload) {
  console.log('📡 POST /api/academic/classes', payload);
  console.log('📦 Expected response:', {
    success: true,
    message: '4 class(es) created successfully',
    data: {
      classes: [{ _id: 'string', name: 'JSS1', level: 1, isActive: true }],
      total: 4,
      errors: [],
    },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/academic/classes', payload);
    if (data.success) data.data.classes = normalizeList(data.data.classes);
    return data;
  }

  await delay(800);

  // Each class gets a stable, unique mock ID
  const ts = Date.now();
  const generated = payload.classes.map((c, i) => ({
    id: `class_${ts}_${i}`,
    _id: `class_${ts}_${i}`,
    name: c.name,
    level: c.level ?? i + 1,
    description: c.description || '',
    isActive: true,
  }));

  return {
    success: true,
    message: `${generated.length} class(es) created successfully`,
    data: { classes: generated, total: generated.length, errors: [] },
  };
}

// =============================================================================
// PUT /api/academic/classes/:classId
// =============================================================================
export async function updateClass(classId, payload) {
  // payload: { name?, level?, description? }
  console.log(`📡 PUT /api/academic/classes/${classId}`, payload);
  console.log('📦 Expected response:', {
    success: true,
    message: 'Class updated successfully',
    data: { _id: classId, ...payload },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/academic/classes/${classId}`, payload);
    if (data.success) data.data = normalizeId(data.data);
    return data;
  }

  await delay();
  return {
    success: true,
    message: 'Class updated successfully',
    data: { id: classId, ...payload },
  };
}

// =============================================================================
// DELETE /api/academic/classes
// Unified format: classIds may be a single string OR an array of strings.
//
// Body sent:   { classIds: ['id1', 'id2'] }
// Response:    { success, message, data: { deleted, errors } }
// =============================================================================
export async function deleteClasses(classIds) {
  const ids = Array.isArray(classIds) ? classIds : [classIds];
  console.log('📡 DELETE /api/academic/classes', { classIds: ids });
  console.log('📦 Expected response:', {
    success: true,
    message: `${ids.length} class(es) deleted successfully`,
    data: { deleted: ids.length, errors: [] },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.delete('/api/academic/classes', {
      data: { classIds: ids },
    });
    return data;
  }

  await delay();
  return {
    success: true,
    message: `${ids.length} class(es) deleted successfully`,
    data: { deleted: ids.length, errors: [] },
  };
}

// =============================================================================
// GET /api/academic/classes/:classId/subjects
// Returns the union of subjects assigned to all arms under the given class.
// =============================================================================
export async function getClassSubjects(classId) {
  console.log(`📡 GET /api/academic/classes/${classId}/subjects`);
  console.log('📦 Expected response:', {
    success: true,
    data: { subjects: [], total: 0 },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/academic/classes/${classId}/subjects`);
    if (data.success) data.data.subjects = normalizeList(data.data.subjects);
    return data;
  }

  await delay();
  return { success: true, data: { subjects: [], total: 0 } };
}

// =============================================================================
// POST /api/academic/classes/:classId/subjects
// Adds subjects to ALL arms under the class (class-wide assignment).
//
// subjectIds: string | string[]
// Effect:     broadcasts to every arm under the class
// =============================================================================
export async function addSubjectsToClass(classId, subjectIds) {
  const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
  console.log(`📡 POST /api/academic/classes/${classId}/subjects`, { subjectIds: ids });
  console.log('📦 Effect: adds subjects to ALL arms under this class');
  console.log('📦 Expected response:', {
    success: true,
    message: `${ids.length} subject(s) added to class`,
    data: { subjects: [], total: ids.length, errors: [] },
  });

  if (CLASSES_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/academic/classes/${classId}/subjects`, {
      subjectIds: ids,
    });
    return data;
  }

  await delay(500);
  return {
    success: true,
    message: `${ids.length} subject(s) added to class`,
    data: {
      subjects: ids.map((id) => ({ id })),
      total: ids.length,
      errors: [],
    },
  };
}



// =============================================================================
// DEPRECATED SHIMS
// Kept so that any existing imports in TimetableBuilder / timetable wizard do
// not break during the transition period.  Remove once all callers are updated.
// =============================================================================

/**
 * @deprecated  Use createClasses() with the new /api/academic/classes format.
 */
export async function bulkCreateClasses(payload) {
  console.warn(
    '⚠️  bulkCreateClasses() is deprecated. Call createClasses() with { classes: [{ name, level }] } instead.'
  );
  return createClasses(payload);
}

/**
 * @deprecated  Use deleteClasses(id) with the unified format.
 */
export async function deleteClass(classId) {
  console.warn(
    '⚠️  deleteClass(id) is deprecated. Call deleteClasses(id) instead.'
  );
  return deleteClasses(classId);
}
