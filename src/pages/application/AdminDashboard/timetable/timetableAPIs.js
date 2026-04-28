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

export const TIMETABLE_BACKEND_LIVE = false;

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stub(label, payload, mockData) {
  console.log(`📡 ${label}`, payload ?? '');
  console.log('📦 Mock response:', mockData);
  return mockData;
}

// =============================================================================
// ACADEMIC YEARS
// POST /api/admin/academic-years
// GET  /api/admin/academic-years
// =============================================================================

export async function getAcademicYears() {
  console.log('📡 GET /api/admin/academic-years');
  console.log('📦 Expected response shape:', {
    success: true,
    data: { academicYears: [{ id: 'string', name: '2025/2026', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', isActive: true }] },
  });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/academic-years');
    return data;
  }

  await delay();
  return { success: true, data: { academicYears: [] } };
}

export async function createAcademicYear(payload) {
  // payload: { name: '2025/2026', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
  console.log('📡 POST /api/admin/academic-years', payload);
  console.log('📦 Expected response:', { success: true, data: { academicYear: { id: 'string', ...payload, isActive: false } } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/academic-years', payload);
    return data;
  }

  await delay();
  return { success: true, data: { academicYear: { id: `ay_${Date.now()}`, ...payload, isActive: false } } };
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
    const { data } = await apiClient.get('/api/admin/terms', { params: { academicYearId } });
    return data;
  }

  await delay();
  return { success: true, data: { terms: [] } };
}

export async function createTerm(payload) {
  // payload: { academicYearId, name, startDate, endDate, type: 'regular'|'exam' }
  console.log('📡 POST /api/admin/terms', payload);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/terms', payload);
    return data;
  }

  await delay();
  return { success: true, data: { term: { id: `term_${Date.now()}`, ...payload } } };
}

// =============================================================================
// HOLIDAYS & EVENTS
// GET  /api/admin/holidays?termId=
// POST /api/admin/holidays
// DELETE /api/admin/holidays/:id
// =============================================================================

export async function getHolidays(termId) {
  console.log('📡 GET /api/admin/holidays', { params: { termId } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/holidays', { params: { termId } });
    return data;
  }

  await delay();
  return { success: true, data: { holidays: [] } };
}

export async function createHoliday(payload) {
  // payload: { termId, name, date, endDate, type: 'holiday'|'exam_period'|'midterm'|'event'|'closure', color }
  console.log('📡 POST /api/admin/holidays', payload);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/holidays', payload);
    return data;
  }

  await delay();
  return { success: true, data: { holiday: { id: `holiday_${Date.now()}`, ...payload } } };
}

export async function deleteHoliday(holidayId) {
  console.log(`📡 DELETE /api/admin/holidays/${holidayId}`);

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/admin/holidays/${holidayId}`);
    return data;
  }

  await delay(200);
  return { success: true };
}

// =============================================================================
// TIMETABLE DRAFT
// GET  /api/admin/timetable/draft?classId=&termId=
// POST /api/admin/timetable/draft
// =============================================================================

export async function getTimetableDraft(classId, termId) {
  console.log('📡 GET /api/admin/timetable/draft', { params: { classId, termId } });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      draft: {
        id: 'string | null',
        classId,
        termId,
        periods: [/* PeriodConfig */],
        schedules: [/* ScheduleEntry[] */],
        updatedAt: 'ISO8601',
      },
    },
  });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/timetable/draft', { params: { classId, termId } });
    return data;
  }

  await delay();
  return { success: true, data: { draft: null } };
}

export async function saveTimetableDraft(payload) {
  // payload: { classId, termId, academicYearId, periods: PeriodConfig[], schedules: ScheduleEntry[] }
  console.log('📡 POST /api/admin/timetable/draft', payload);
  console.log('📦 Expected response:', { success: true, data: { draftId: 'string', savedAt: 'ISO8601' } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/admin/timetable/draft', payload);
    return data;
  }

  await delay(600);
  return { success: true, data: { draftId: `draft_${Date.now()}`, savedAt: new Date().toISOString() } };
}

export async function deleteTimetableDraft(classId, termId) {
  console.log('📡 DELETE /api/admin/timetable/draft', { params: { classId, termId } });
  
  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.delete('/api/admin/timetable/draft', { params: { classId, termId } });
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
  // payload: { classId, termId, schedules: ScheduleEntry[] }
  console.log('📡 POST /api/admin/timetable/check-conflicts', payload);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      hasConflicts: false,
      conflicts: [{
        type: 'TEACHER_DOUBLE_BOOKING | ROOM_CONFLICT | PERIOD_DUPLICATION | SUBJECT_OVERLOAD',
        severity: 'error | warning',
        message: 'string',
        slots: [{ day: 'string', periodId: 'string' }],
      }],
    },
  });

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
   * payload shape:
   * {
   *   academicYearId: string,
   *   termId: string,
   *   classId: string,
   *   periods: [...],
   *   schedules: [
   *     {
   *       classId, className, dayOfWeek, periodId, periodNumber,
   *       startTime, endTime, subjectId, subjectName,
   *       teacherId, teacherName, roomId, roomName
   *     }
   *   ]
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

export async function getPublishedTimetable(classId, termId) {
  console.log('📡 GET /api/admin/timetable/published', { params: { classId, termId } });

  if (TIMETABLE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/admin/timetable/published', { params: { classId, termId } });
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
          scheduleId:       'string',   // backend-generated, stable ID
          classId:          'string',
          className:        'string',   // e.g. "Grade 10A"
          subjectId:        'string',
          subjectName:      'string',
          periodId:         'string',
          periodNumber:     'number',
          timeSlot:         { start: 'HH:mm', end: 'HH:mm' },
          room:             'string | null',
          teacherId:        'string',
          attendanceStatus: 'not_started | in_progress | completed',
          attendanceId:     'string | null',
          studentCount:     'number',
          presentCount:     'number',
          absentCount:      'number',
          lateCount:        'number',
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
