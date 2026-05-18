import apiClient from '../../../../utils/axiosConfig.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Arm APIs  —  /api/academic/arms  &  /api/academic/classes/:classId/arms
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FEATURE FLAG:
 *   Set ARMS_BACKEND_LIVE = true once the backend endpoints are deployed.
 *
 * UNIFIED ID FORMAT:
 *   All delete / assign / copy endpoints accept a single string OR an array.
 *
 * ARM SUBJECTS:
 *   Each Arm tracks its own subject list independently.  This enables SSS arms
 *   (Science / Art / Commercial) to carry different subjects while JSS arms
 *   share the same set.
 *
 *   add     →  POST /api/academic/arms/:armId/subjects           (additive)
 *   replace →  POST /api/academic/arms/:armId/subjects/replace   (full swap)
 *   copy    →  POST /api/academic/arms/:srcId/subjects/copy      (copy src → targets)
 *
 * ID NORMALISATION:
 *   normalizeId maps _id → id so state always uses `id`.
 */

export const ARMS_BACKEND_LIVE = true;

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
// POST /api/academic/arms
// Creates one or more arms (class sections).
//
// Payload:
//   {
//     arms: [
//       { classId: string, name: string, classTeacherId?: string }
//     ]
//   }
//
// Response (201):
//   { success, message, data: { arms: [...], total, errors: [] } }
// =============================================================================
export async function createArms(payload) {
  console.log('📡 POST /api/academic/arms', payload);
  console.log('📦 Expected response:', {
    success: true,
    message: '3 arm(s) created successfully',
    data: {
      arms: [
        { _id: 'string', classId: 'string', name: 'A', subjects: [], isActive: true },
      ],
      total: 3,
      errors: [],
    },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/academic/arms', payload);
    if (data.success) data.data.arms = normalizeList(data.data.arms);
    return data;
  }

  await delay(600);

  const ts = Date.now();
  const generated = payload.arms.map((a, i) => ({
    id: `arm_${ts}_${i}`,
    _id: `arm_${ts}_${i}`,
    classId: a.classId,
    name: a.name,
    classTeacherId: a.classTeacherId || null,
    subjects: [],
    isActive: true,
  }));

  return {
    success: true,
    message: `${generated.length} arm(s) created successfully`,
    data: { arms: generated, total: generated.length, errors: [] },
  };
}

// =============================================================================
// GET /api/academic/classes/:classId/arms
// Returns all arms (sections) belonging to the given class.
// =============================================================================
export async function getClassArms(classId) {
  console.log(`📡 GET /api/academic/classes/${classId}/arms`);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      arms: [
        { _id: 'string', classId, name: 'A', subjects: [], isActive: true },
      ],
      total: 3,
    },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/academic/classes/${classId}/arms`);
    if (data.success) data.data.arms = normalizeList(data.data.arms);
    return data;
  }

  await delay();
  return { success: true, data: { arms: [], total: 0 } };
}

// =============================================================================
// PUT /api/academic/arms/:armId
//
// Payload: { name?: string, classTeacherId?: string }
// Response: { success, message, data: { updated arm } }
// =============================================================================
export async function updateArm(armId, payload) {
  console.log(`📡 PUT /api/academic/arms/${armId}`, payload);
  console.log('📦 Expected response:', {
    success: true,
    message: 'Arm updated successfully',
    data: { _id: armId, ...payload },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/academic/arms/${armId}`, payload);
    if (data.success) data.data = normalizeId(data.data);
    return data;
  }

  await delay();
  return {
    success: true,
    message: 'Arm updated successfully',
    data: { id: armId, ...payload },
  };
}

// =============================================================================
// DELETE /api/academic/arms
// Unified format: armIds may be a single string OR an array of strings.
//
// Body sent:   { armIds: ['id1', 'id2'] }
// Response:    { success, message, data: { deleted, errors } }
// =============================================================================
export async function deleteArms(armIds) {
  const ids = Array.isArray(armIds) ? armIds : [armIds];
  console.log('📡 DELETE /api/academic/arms', { armIds: ids });
  console.log('📦 Expected response:', {
    success: true,
    message: `${ids.length} arm(s) deleted successfully`,
    data: { deleted: ids.length, errors: [] },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.delete('/api/academic/arms', {
      data: { armIds: ids },
    });
    return data;
  }

  await delay();
  return {
    success: true,
    message: `${ids.length} arm(s) deleted successfully`,
    data: { deleted: ids.length, errors: [] },
  };
}

// =============================================================================
// ARM SUBJECTS
// =============================================================================

// -----------------------------------------------------------------------------
// GET /api/academic/arms/:armId/subjects
// Returns subjects currently assigned to this arm.
// -----------------------------------------------------------------------------
export async function getArmSubjects(armId) {
  console.log(`📡 GET /api/academic/arms/${armId}/subjects`);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      subjects: [{ _id: 'string', name: 'Mathematics', code: 'MTH', category: 'core' }],
      total: 5,
    },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/academic/arms/${armId}/subjects`);
    if (data.success) data.data.subjects = normalizeList(data.data.subjects);
    return data;
  }

  await delay();
  return { success: true, data: { subjects: [], total: 0 } };
}

// -----------------------------------------------------------------------------
// POST /api/academic/arms/:armId/subjects
// ADDITIVE — appends subjects to the arm's existing list.
//
// subjectIds: string | string[]
// Response:   { success, message, data: { added: [...], errors: [] } }
// -----------------------------------------------------------------------------
export async function addSubjectsToArm(armId, subjectIds) {
  const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
  console.log(`📡 POST /api/academic/arms/${armId}/subjects`, { subjectIds: ids });
  console.log('📦 Expected response:', {
    success: true,
    message: `${ids.length} subject(s) added to arm`,
    data: {
      added: ids.map((id) => ({ subjectId: id, subjectName: '' })),
      errors: [],
    },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/academic/arms/${armId}/subjects`, {
      subjectIds: ids,
    });
    return data;
  }

  await delay(400);
  return {
    success: true,
    message: `${ids.length} subject(s) added to arm`,
    data: {
      added: ids.map((id) => ({ subjectId: id, subjectName: '' })),
      errors: [],
    },
  };
}

// -----------------------------------------------------------------------------
// POST /api/academic/arms/:armId/subjects/replace
// DESTRUCTIVE — replaces ALL existing subjects on the arm with the new set.
//
// subjectIds: string[]
// Response:   { success, message, data: { armId, armName, subjects, errors } }
// -----------------------------------------------------------------------------
export async function replaceArmSubjects(armId, subjectIds) {
  const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
  console.log(`📡 POST /api/academic/arms/${armId}/subjects/replace`, { subjectIds: ids });
  console.log('📦 Expected response:', {
    success: true,
    message: 'Arm subjects replaced successfully',
    data: { armId, armName: '', subjects: ids, errors: [] },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.post(
      `/api/academic/arms/${armId}/subjects/replace`,
      { subjectIds: ids }
    );
    return data;
  }

  await delay(500);
  return {
    success: true,
    message: 'Arm subjects replaced successfully',
    data: { armId, armName: '', subjects: ids, errors: [] },
  };
}

// -----------------------------------------------------------------------------
// POST /api/academic/arms/:sourceArmId/subjects/copy
// Copies ALL subjects from sourceArm to one or more target arms.
// Useful for JSS classes where every section shares the same subjects.
//
// targetArmIds: string | string[]
// Response:     { success, message, data: { sourceArmId, sourceArmName,
//                 subjectsCopied, results: [...], errors: [] } }
// -----------------------------------------------------------------------------
export async function copySubjectsToArms(sourceArmId, targetArmIds) {
  const ids = Array.isArray(targetArmIds) ? targetArmIds : [targetArmIds];
  console.log(
    `📡 POST /api/academic/arms/${sourceArmId}/subjects/copy`,
    { targetArmIds: ids }
  );
  console.log('📦 Expected response:', {
    success: true,
    message: `Copied subjects to ${ids.length} arms`,
    data: {
      sourceArmId,
      sourceArmName: '',
      subjectsCopied: 0,
      results: ids.map((id) => ({ targetArmId: id, armName: '', subjectsCount: 0 })),
      errors: [],
    },
  });

  if (ARMS_BACKEND_LIVE) {
    const { data } = await apiClient.post(
      `/api/academic/arms/${sourceArmId}/subjects/copy`,
      { targetArmIds: ids }
    );
    return data;
  }

  await delay(600);
  return {
    success: true,
    message: `Copied subjects to ${ids.length} arms`,
    data: {
      sourceArmId,
      sourceArmName: '',
      subjectsCopied: 0,
      results: ids.map((id) => ({ targetArmId: id, armName: '', subjectsCount: 0 })),
      errors: [],
    },
  };
}
