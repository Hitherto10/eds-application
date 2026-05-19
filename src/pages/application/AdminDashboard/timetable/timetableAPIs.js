/**
 * Timetable & Academic Calendar API Stubs
 * ─────────────────────────────────────────────────────────────────────────────
 * Every function logs its exact payload / URL so the backend developer has a
 * clear specification to implement against.
 *
 * Replace the stub returns with real apiClient calls once endpoints are live.
 *
 * FEATURE FLAG:
 *   Set TIMETABLE_BACKEND_LIVE = true once the backend is deployed.
 *   getScheduledClasses() in attendanceAPIs.js reads this flag to switch from
 *   synthetic schedule generation to GET /api/teacher/timetable/today.
 */

import apiClient from '../../../../utils/axiosConfig';

export const TIMETABLE_BACKEND_LIVE = true;

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stub(label, payload, mockData) {
  console.log(`📡 ${label}`, payload ?? '');
  console.log('📦 Mock response:', mockData);
  return mockData;
}

// =============================================================================
// SCHOOL ACADEMIC PROFILE
// GET  /api/school/profile  (extended with academic context fields)
// PUT  /api/school/profile/academic-context
//
// BACKEND DEVELOPER NOTES:
//   The GET /api/school/profile response must be extended to include the fields
//   below. These are additive — existing consumers of the endpoint are unaffected.
//   The PUT endpoint is a NEW dedicated endpoint for updating academic context
//   so we do not collide with the existing updateSchool() used for school info.
// =============================================================================

export async function getAcademicProfile() {
  /**
   * 📡 GET /api/school/profile
   *
   * No request payload required.
   *
   * 📦 Expected response (extended model — new fields marked [NEW]):
   * {
   *   "success": true,
   *   "message": "School profile retrieved successfully",
   *   "data": {
   *     "school": {
   *       "id": "string",
   *       "schoolId": "string",
   *       "schoolName": "string",
   *       "terms": [],           // legacy field — keep as-is
   *       "events": [],          // formerly holidays
   *       "settings": {},
   *
   *       "[NEW] currentAcademicYear": {
   *         "id": "year-123",
   *         "name": "2025/2026",
   *         "startDate": "YYYY-MM-DD",
   *         "endDate": "YYYY-MM-DD",
   *         "expectedEndDate": "2026-07-30T00:00:00Z",
   *         "isActive": true
   *       },
   *
   *       "[NEW] currentTerm": {
   *         "id": "term-456",
   *         "name": "First Term",
   *         "academicYearId": "year-123",
   *         "startDate": "YYYY-MM-DD",
   *         "endDate": "YYYY-MM-DD",
   *         "expectedEndDate": "2025-12-15T00:00:00Z",
   *         "isCurrent": true
   *       },
   *
   *       "[NEW] academicYears": [
   *         {
   *           "id": "year-123",
   *           "name": "2025/2026",
   *           "startDate": "YYYY-MM-DD",
   *           "endDate": "YYYY-MM-DD",
   *           "isActive": true
   *         },
   *         {
   *           "id": "year-124",
   *           "name": "2026/2027",
   *           "startDate": "YYYY-MM-DD",
   *           "endDate": "YYYY-MM-DD",
   *           "isActive": false
   *         }
   *       ]
   *     }
   *   }
   * }
   *
   * ❌ Error response example:
   * { "success": false, "message": "Unauthorized" }
   */
  // console.log('📡 GET /api/school/profile (extended with academic context)');

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/school/profile');
    return data;
  }

  await delay();

  // ── DEMO DATA ──────────────────────────────────────────────────────────────
  // Replace this with the real API call above when backend is ready.
  const now = new Date().toISOString();
  return {
    success: true,
    data: {
      school: {
        id: 'demo_school_1',
        schoolId: 'SAM1504',
        schoolName: 'Samsung International School',
        terms: [],
        events: [],
        settings: {},
        currentAcademicYear: {
          id: 'ay_2025_2026',
          name: '2025/2026',
          startDate: '2025-09-01',
          endDate: '2026-07-30',
          expectedEndDate: '2026-07-30T00:00:00Z',
          isActive: true,
        },
        currentTerm: {
          id: 'term_first_2025',
          name: 'First Term',
          academicYearId: 'ay_2025_2026',
          startDate: '2025-09-01',
          endDate: '2025-12-15',
          expectedEndDate: '2025-12-15T00:00:00Z',
          isCurrent: true,
        },
        academicYears: [
          {
            id: 'ay_2024_2025',
            name: '2024/2025',
            startDate: '2024-09-01',
            endDate: '2025-07-30',
            isActive: false,
          },
          {
            id: 'ay_2025_2026',
            name: '2025/2026',
            startDate: '2025-09-01',
            endDate: '2026-07-30',
            isActive: true,
          },
          {
            id: 'ay_2026_2027',
            name: '2026/2027',
            startDate: '2026-09-01',
            endDate: '2027-07-30',
            isActive: false,
          },
        ],
      },
    },
  };
}

export async function setAcademicContext(yearID) {
  /**
   * 📡 PUT /api/school/profile/academic-context
   *
   * 📤 Request payload:
   * {
   *   "currentAcademicYearId": "year-123",   // set active year (null to clear)
   *   "currentTermId": "term-456"             // set current term (null to clear)
   * }
   *
   * 📦 Expected response:
   * {
   *   "success": true,
   *   "message": "Academic context updated successfully",
   *   "data": {
   *     "currentAcademicYear": { "id": "year-123", "name": "2025/2026", ... },
   *     "currentTerm": { "id": "term-456", "name": "First Term", ... }
   *   }
   * }
   *
   * ❌ Error response example:
   * {
   *   "success": false,
   *   "message": "Academic year not found",
   *   "error": "INVALID_ACADEMIC_YEAR_ID"
   * }
   */
  // console.log('📡 PUT /api/school/profile/academic-context', yearID);
  // console.log('📦 Expected response:', {
  //   success: true,
  //   message: 'Academic context updated successfully',
  //   data: { currentAcademicYear: { id: 'year-123', name: '2025/2026' }, currentTerm: { id: 'term-456', name: 'First Term' } },
  // });

  if (TIMETABLE_BACKEND_LIVE) {
    // const { data } = await apiClient.put('/api/school/profile/academic-context', payload);
    const { data } = await apiClient.put(`/api/academic/years/${yearID}/current`);
    return data;
  }

  await delay(500);
  return {
    success: true,
    message: 'Academic context updated successfully',
    data: { currentAcademicYearId: yearID.currentAcademicYearId, currentTermId: yearID.currentTermId },
  };
}

// =============================================================================
// ACADEMIC YEARS
// POST /api/admin/academic-years
// GET  /api/admin/academic-years
// =============================================================================

export async function getAcademicYears() {
  // console.log('📡 GET /api/admin/academic-years');
  // console.log('📦 Expected response shape:', {
  //   success: true,
  //   data: { academicYears: [{ id: 'string', name: '2025/2026', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', isActive: true }] },
  // });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/academic/years');
    return data;
  }

  await delay();
  return { success: true, data: { academicYears: [] } };
}

//  Create Academic Year
export async function createAcademicYear(payload) {
  // payload: { name: '2025/2026', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
  console.log('📡 POST /api/admin/academic-years', payload);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      academicYear: {
        id: 'string',
        ...payload,
        isCurrent: false
      }
    }});

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/academic/years', payload);
    return data;
  }

  await delay();
  return { success: true, data: { academicYear: { id: `ay_${Date.now()}`, ...payload, isActive: false } } };
}

export async function updateAcademicYear(id, payload) {
  console.log(`📡 PUT /api/admin/academic-years/${id}`, payload);
  console.log('📦 Expected response:', { success: true, data: { academicYear: { id, ...payload } } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/admin/academic-years/${id}`, payload);
    return data;
  }

  await delay();
  return { success: true, data: { academicYear: { id, ...payload } } };
}

export async function deleteAcademicYear(id) {
  console.log(`📡 DELETE /api/admin/academic-years/${id}`);
  console.log('📦 Expected response:', { success: true });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/admin/academic-years/${id}`);
    return data;
  }

  await delay();
  return { success: true };
}

// =============================================================================
// TERMS
// GET  /api/admin/terms?academicYearId=
// POST /api/admin/terms
// =============================================================================

export async function getTerms(academicYearId) {
  console.log('📡 GET /api/admin/terms', { params: { academicYearId } });
  console.log('📦 Expected response:', {
    success: true,
    data: { terms: [{ id: 'string', academicYearId, name: 'First Term', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', type: 'regular' }] },
  });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/academic/terms', { params: { academicYearId } });
    return data;
  }

  await delay();
  return { success: true, data: { terms: [] } };
}

export async function createTerm(payload) {
  // payload: { academicYearId, name, startDate, endDate, type: 'regular'|'exam' }
  console.log('📡 POST /api/admin/terms', payload);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/academic/terms', payload);
    return data;
  }

  await delay();
  return { success: true, data: { term: { id: `term_${Date.now()}`, ...payload } } };
}

export async function updateTerm(id, payload) {
  console.log(`📡 PUT /api/admin/terms/${id}`, payload);
  console.log('📦 Expected response:', { success: true, data: { term: { id, ...payload } } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/admin/terms/${id}`, payload);
    return data;
  }

  await delay();
  return { success: true, data: { term: { id, ...payload } } };
}

// /api/academic/terms/:termId/current
export async function setCurrentTerm(id) {
    const { data } = await apiClient.put(`/api/academic/terms/${id}/current`);
    return data;
}

export async function deleteTerm(id) {
  console.log(`📡 DELETE /api/admin/terms/${id}`);
  console.log('📦 Expected response:', { success: true });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/admin/terms/${id}`);
    return data;
  }

  await delay();
  return { success: true };
}

// =============================================================================
// EVENTS (Formerly Holidays)
// GET  /api/admin/events?termId=
// POST /api/admin/events
// DELETE /api/admin/events/:id
// =============================================================================

export async function getEvents(termId) {
  console.log('📡 GET /api/admin/events', { params: { termId } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/events', { params: { termId } });
    return data;
  }

  await delay();
  return { success: true, data: { events: [] } };
}

export async function createEvent(payload) {
  // payload: { termId, name, date, endDate, type: 'holiday'|'exam'|'event', notifications?: any }
  console.log('📡 POST /api/admin/events', payload);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/events', payload);
    return data;
  }

  await delay();
  const notificationConfigId = payload.notifications?.enabled ? `cfg_${Date.now()}` : null;
  return { success: true, data: { event: { id: `event_${Date.now()}`, notificationConfigId, ...payload } } };
}

export async function updateEvent(eventId, payload) {
  console.log(`📡 PUT /api/admin/events/${eventId}`, payload);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/admin/events/${eventId}`, payload);
    return data;
  }

  await delay();
  const notificationConfigId = payload.notifications?.enabled ? `cfg_${Date.now()}` : null;
  return { success: true, data: { event: { id: eventId, notificationConfigId, ...payload } } };
}

export async function deleteEvent(eventId) {
  console.log(`📡 DELETE /api/admin/events/${eventId}`);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/admin/events/${eventId}`);
    return data;
  }

  await delay(200);
  return { success: true };
}

// =============================================================================
// EVENT NOTIFICATIONS
// PUT  /api/admin/events/:eventId/notifications
// GET  /api/admin/events/:eventId/notifications
// POST /api/admin/events/:eventId/notify
// GET  /api/admin/notifications/logs
// =============================================================================

export async function updateEventNotificationSettings(eventId, payload) {
  console.log(`📡 PUT /api/admin/events/${eventId}/notifications`, payload);
  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/admin/events/${eventId}/notifications`, payload);
    return data;
  }
  await delay(300);
  return { success: true, data: { id: `cfg_${Date.now()}`, status: payload.schedule?.type === 'scheduled' ? 'scheduled' : 'processing' } };
}

export async function getEventNotificationsConfig(eventId) {
  console.log(`📡 GET /api/admin/events/${eventId}/notifications`);
  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/admin/events/${eventId}/notifications`);
    return data;
  }
  await delay();
  return { success: true, data: { id: `cfg_${eventId}`, targets: { roles: [], classIds: [], userIds: [] }, channels: [], schedule: { type: 'immediate' }, status: 'draft' } };
}

export async function sendNotificationOverride(eventId, payload) {
  console.log(`📡 POST /api/admin/events/${eventId}/notify`, payload);
  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/admin/events/${eventId}/notify`, payload);
    return data;
  }
  await delay(400);
  return { success: true, message: 'Notification job queued successfully.' };
}

export async function getNotificationLogs(eventId, status) {
  console.log(`📡 GET /api/admin/notifications/logs`, { params: { eventId, status } });
  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/notifications/logs', { params: { eventId, status } });
    return data;
  }
  await delay();
  return { success: true, data: { total: 0, failed: 0, logs: [] } };
}

// =============================================================================
// TIMETABLE DRAFT
// GET  /api/admin/timetable/draft?classId=&termId=
// POST /api/admin/timetable/draft
// =============================================================================

export async function getTimetableDraft(classId, termId, armId = null) {
  /**
   * 📡 GET /api/admin/timetable/draft
   *
   * 📤 Query params:
   * {
   *   classId: string,           // required
   *   termId:  string,           // required
   *   armId:   string | null     // optional — omit or null when class has no arms
   * }
   *
   * 📦 Expected response:
   * {
   *   "success": true,
   *   "data": {
   *     "draft": {
   *       "id": "string | null",
   *       "classId": "string",
   *       "termId": "string",
   *       "armId": "string | null",
   *       "periods": [ PeriodConfig ],
   *       "schedules": [ ScheduleEntry ],
   *       "updatedAt": "ISO8601"
   *     }
   *   }
   * }
   *
   * BACKEND NOTE:
   *   The composite key for a draft is (classId, termId, armId).
   *   When armId is null/absent the draft covers the whole class (no arm).
   *   Timetables for different arms of the same class are stored as separate
   *   draft records and never merged.
   */
  const params = { classId, termId, ...(armId ? { armId } : {}) };
  console.log('📡 GET /api/admin/timetable/draft', { params });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/timetable/draft', { params });
    return data;
  }

  await delay();
  return { success: true, data: { draft: null } };
}

export async function saveTimetableDraft(payload) {
  /**
   * 📡 POST /api/admin/timetable/draft
   *
   * 📤 Request body:
   * {
   *   "classId":        "string",           // required
   *   "termId":         "string",           // required
   *   "academicYearId": "string",           // required
   *   "armId":          "string | null",    // null = whole-class timetable
   *   "periods":        [ PeriodConfig ],
   *   "schedules":      [ ScheduleEntry ]   // each entry also carries armId
   * }
   *
   * 📦 Expected response:
   * {
   *   "success": true,
   *   "data": { "draftId": "string", "savedAt": "ISO8601" }
   * }
   *
   * BACKEND NOTE:
   *   Upsert on composite key (classId, termId, armId).
   *   armId = null and armId = "some-id" are treated as distinct drafts.
   */
  console.log('📡 POST /api/admin/timetable/draft', payload);

  // if (TIMETABLE_BACKEND_LIVE) {
  //   const { data } = await apiClient.post('/api/admin/timetable/draft', payload);
  //   return data;
  // }

  await delay(600);
  return { success: true, data: { draftId: `draft_${Date.now()}`, savedAt: new Date().toISOString() } };
}

export async function deleteTimetableDraft(classId, termId, armId = null) {
  /**
   * 📡 DELETE /api/admin/timetable/draft
   *
   * 📤 Query params: { classId, termId, armId? }
   * Deletes the draft whose composite key matches (classId, termId, armId).
   */
  const params = { classId, termId, ...(armId ? { armId } : {}) };
  console.log('📡 DELETE /api/admin/timetable/draft', { params });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.delete('/api/admin/timetable/draft', { params });
    return data;
  }

  await delay(600);
  return { success: true };
}

// =============================================================================
// CONFLICT CHECK
// POST /api/admin/timetable/check-conflicts
// =============================================================================

export async function checkConflicts(payload) {
  /**
   * 📡 POST /api/admin/timetable/check-conflicts
   *
   * 📤 Request body:
   * {
   *   "classId":   "string",
   *   "termId":    "string",
   *   "armId":     "string | null",   // null = whole-class timetable
   *   "schedules": [ ScheduleEntry ]
   * }
   *
   * 📦 Expected response:
   * {
   *   "success": true,
   *   "data": {
   *     "hasConflicts": false,
   *     "conflicts": [
   *       {
   *         "type":     "TEACHER_DOUBLE_BOOKING | ROOM_CONFLICT | PERIOD_DUPLICATION | SUBJECT_OVERLOAD",
   *         "severity": "error | warning",
   *         "message":  "string",
   *         "slots":    [{ "day": "string", "periodId": "string" }]
   *       }
   *     ]
   *   }
   * }
   *
   * BACKEND NOTE:
   *   The server should also cross-check this arm's schedule against OTHER arms
   *   of the same class (and other classes) to catch teacher/room conflicts that
   *   the frontend engine cannot see (it only holds one draft at a time).
   */
  console.log('📡 POST /api/admin/timetable/check-conflicts', payload);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/timetable/check-conflicts', payload);
    return data;
  }

  await delay(500);
  return { success: true, data: { hasConflicts: false, conflicts: [] } };
}

// =============================================================================
// PUBLISH TIMETABLE
// POST /api/admin/timetable/publish
// GET  /api/admin/timetable/published?classId=&termId=
// =============================================================================

export async function publishTimetable(payload) {
  /**
   * 📡 POST /api/admin/timetable/publish
   *
   * 📤 Request body:
   * {
   *   "academicYearId": "string",
   *   "termId":         "string",
   *   "classId":        "string",
   *   "armId":          "string | null",   // null = whole-class timetable
   *   "periods":        [ PeriodConfig ],
   *   "schedules":      [
   *     {
   *       classId, className, armId, armName,
   *       dayOfWeek, periodId, periodNumber,
   *       startTime, endTime,
   *       subjectId, subjectName,
   *       teacherId, teacherName,
   *       roomId, roomName
   *     }
   *   ]
   * }
   *
   * 📦 Expected response:
   * {
   *   "success": true,
   *   "data": {
   *     "published":          true,
   *     "publishedAt":        "ISO8601",
   *     "timetableId":        "string",
   *     "conflictsResolved":  true,
   *     "schedules":          [ ScheduleEntry with backend-generated scheduleIds ]
   *   }
   * }
   */
  console.log('📡 POST /api/admin/timetable/publish', payload);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      published: true,
      publishedAt: 'ISO8601',
      timetableId: 'string',
      conflictsResolved: true,
      schedules: [/* ScheduleEntry[] with backend-generated scheduleIds */],
    },
  });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/timetable/publish', payload);
    return data;
  }

  await delay(1000);
  return {
    success: true,
    data: {
      published: true,
      publishedAt: new Date().toISOString(),
      timetableId: `tt_${Date.now()}`,
      conflictsResolved: true,
    },
  };
}

export async function getPublishedTimetable(classId, termId, armId = null) {
  /**
   * 📡 GET /api/admin/timetable/published
   *
   * 📤 Query params: { classId, termId, armId? }
   *
   * 📦 Expected response:
   * {
   *   "success": true,
   *   "data": {
   *     "timetable": {
   *       "id":          "string",
   *       "classId":     "string",
   *       "termId":      "string",
   *       "armId":       "string | null",
   *       "publishedAt": "ISO8601",
   *       "periods":     [ PeriodConfig ],
   *       "schedules":   [ ScheduleEntry ]
   *     } | null
   *   }
   * }
   */
  const params = { classId, termId, ...(armId ? { armId } : {}) };
  console.log('📡 GET /api/admin/timetable/published', { params });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/timetable/published', { params });
    return data;
  }

  await delay();
  return { success: true, data: { timetable: null } };
}

// =============================================================================
// TEACHER DAILY SCHEDULE
// GET /api/teacher/timetable/today
// This endpoint ultimately powers getScheduledClasses() in attendanceAPIs.js
// Response shape MUST match what getScheduledClasses() returns.
// =============================================================================

export async function getTeacherDailySchedule(date = new Date().toISOString().split('T')[0]) {
  console.log('📡 GET /api/teacher/timetable/today', { params: { date } });
  console.log('📦 Expected response (must match getScheduledClasses() shape):', {
    success: true,
    data: {
      date,
      academicContext: { academicYearId: 'string', academicYear: 'string', termId: 'string', term: 'string' },
      scheduledClasses: [
        {
          scheduleId: 'string',   // backend-generated, stable ID
          classId: 'string',
          className: 'string',   // e.g. "Grade 10A"
          subjectId: 'string',
          subjectName: 'string',
          periodId: 'string',
          periodNumber: 'number',
          timeSlot: { start: 'HH:mm', end: 'HH:mm' },
          room: 'string | null',
          teacherId: 'string',
          attendanceStatus: 'not_started | in_progress | completed',
          attendanceId: 'string | null',
          studentCount: 'number',
          presentCount: 'number',
          absentCount: 'number',
          lateCount: 'number',
        },
      ],
    },
  });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/teacher/timetable/today', { params: { date } });
    return data;
  }

  await delay();
  return { success: true, data: { date, academicContext: {}, scheduledClasses: [] } };
}
