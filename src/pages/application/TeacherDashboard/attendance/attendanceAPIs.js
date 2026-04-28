/**
 * Attendance API Functions — Frontend Contract
 * ─────────────────────────────────────────────────────────────────────────────
 * Read-side functions (getScheduledClasses, getSessionStudents) now fetch real
 * data from the existing teacher API endpoints in authAPIs.js.
 *
 * Write-side functions (saveDraftAttendance, submitAttendance, updateAttendance)
 * retain their stub implementations until the attendance backend endpoints are
 * live — replace the mock returns with real apiClient calls at that point.
 */

import {
  getTeacherClasses,
  getSubjectsByClass,
  getStudentsByClassandSubject,
  getTeacherDashboard,
} from '../../../auth/authAPIs.js';

// ─── Period time slots (adapt once a real timetable endpoint exists) ──────────
const PERIOD_SLOTS = [
  { periodNumber: 1, start: '08:00', end: '08:45' },
  { periodNumber: 2, start: '09:00', end: '09:45' },
  { periodNumber: 3, start: '10:00', end: '10:45' },
  { periodNumber: 4, start: '11:00', end: '11:45' },
  { periodNumber: 5, start: '13:00', end: '13:45' },
  { periodNumber: 6, start: '14:00', end: '14:45' },
  { periodNumber: 7, start: '15:00', end: '15:45' },
  { periodNumber: 8, start: '16:00', end: '16:45' },
];

// ─── Simple stable ID helpers ─────────────────────────────────────────────────
function classId(className)  { return `cls_${String(className).replace(/\s+/g, '_').toLowerCase()}`; }
function subjectId(subjectName) { return `sub_${String(subjectName).replace(/\s+/g, '_').toLowerCase()}`; }
function scheduleId(className, subjectName, periodNumber) {
  return `sch_${classId(className)}_${subjectId(subjectName)}_p${periodNumber}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/teacher/attendance/schedule
// Builds today's class list from real teacher classes + subjects.
// No timetable endpoint exists yet, so each class-subject pair gets a synthetic
// period slot. Once a real timetable API is available, replace the body below.
// ─────────────────────────────────────────────────────────────────────────────
export async function getScheduledClasses(date = new Date().toISOString().split('T')[0]) {
  if (TIMETABLE_BACKEND_LIVE) {
    // Direct call to the published timetable endpoint once backend exists
    const res = await getTeacherDailySchedule(date);
    if (res.success) return res.data;
    throw new Error("Failed to fetch formal timetable");
  }

  // 1. Fetch real classes assigned to this teacher
  // Fetch classes and dashboard (for academic context) in parallel
  const [classRes, dashboardRes] = await Promise.all([
    getTeacherClasses(),
    getTeacherDashboard(),
  ]);

  const classes = classRes?.data?.classes ?? [];
  const teacher = dashboardRes?.data?.teacher ?? {};

  // Build academic context from dashboard data where available
  const academicContext = {
    academicYearId: teacher.academicYearId ?? 'ay_current',
    academicYear:   teacher.academicYear   ?? 'Current Year',
    termId:         teacher.termId         ?? 'term_current',
    term:           teacher.currentTerm    ?? teacher.term ?? 'Current Term',
  };

  // Fan out: for every class fetch its subjects, then flatten into schedule entries
  const subjectResults = await Promise.allSettled(
    classes.map(cls => getSubjectsByClass(cls.name).then(r => ({ cls, subjects: r?.data?.subjects ?? [] })))
  );

  let periodCounter = 0;
  const scheduledClasses = [];

  for (const result of subjectResults) {
    if (result.status !== 'fulfilled') continue;
    const { cls, subjects } = result.value;

    for (const subject of subjects) {
      const slot = PERIOD_SLOTS[periodCounter % PERIOD_SLOTS.length];
      periodCounter++;

      scheduledClasses.push({
        scheduleId:       scheduleId(cls.name, subject.name, slot.periodNumber),
        classId:          classId(cls.name),
        className:        cls.name,
        subjectId:        subjectId(subject.name),
        subjectName:      subject.name,
        periodId:         `per_${String(slot.periodNumber).padStart(3, '0')}`,
        periodNumber:     slot.periodNumber,
        timeSlot:         { start: slot.start, end: slot.end },
        room:             null,
        attendanceStatus: 'not_started',
        attendanceId:     null,
        studentCount:     subject.studentCount ?? cls.studentCount ?? 0,
        presentCount:     0,
        absentCount:      0,
        lateCount:        0,
      });
    }
  }

  return {
    success: true,
    data: {
      date,
      academicContext,
      scheduledClasses,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/teacher/attendance/sessions/:scheduleId/students
// Fetches real students for the class+subject encoded in the scheduleId.
// scheduleId format: sch_<classId>_<subjectId>_p<period>
// ─────────────────────────────────────────────────────────────────────────────
export async function getSessionStudents(scheduleEntry) {
  // scheduleEntry is the full schedule object (className + subjectName)
  // so we can call the real endpoint directly.
  const { className, subjectName, scheduleId: sid } = scheduleEntry;

  if (!className || !subjectName) {
    throw new Error('getSessionStudents requires className and subjectName on the schedule entry.');
  }

  const res = await getStudentsByClassandSubject(className, subjectName);
  const rawStudents = res?.data?.students ?? [];

  // Normalise to the shape AttendanceRegister expects
  const students = rawStudents.map((s, i) => ({
    studentId:      s.id || s._id || s.studentId,
    rollNumber:     s.studentId || String(i + 1).padStart(3, '0'),
    fullName:       s.fullName,
    status:         null,   // not yet marked
    reason:         '',
    lateArrivalTime: '',
  }));

  return {
    success: true,
    data: {
      scheduleId:       sid,
      attendanceId:     null,
      attendanceStatus: 'not_started',
      submittedAt:      null,
      students,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/teacher/attendance/draft
// Saves attendance as draft (can be edited later, not locked)
// ─────────────────────────────────────────────────────────────────────────────
export async function saveDraftAttendance(payload) {
  console.log('📡 POST /api/teacher/attendance/draft', payload);
  console.log('📦 Payload contract:', {
    academicYearId: 'string',
    termId: 'string',
    scheduleId: 'string',
    classId: 'string',
    subjectId: 'string',
    periodId: 'string',
    teacherId: 'string',
    date: 'YYYY-MM-DD',
    attendances: [
      {
        studentId: 'string',
        status: 'present | absent | late | null',
        reason: 'string',
        lateArrivalTime: 'HH:mm | empty string',
      },
    ],
  });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      attendanceId: 'string',
      status: 'draft',
      savedAt: 'ISO8601',
    },
  });

  await delay(800);
  return {
    success: true,
    data: {
      attendanceId: payload.attendanceId || `att_${Date.now()}`,
      status: 'draft',
      savedAt: new Date().toISOString(),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/teacher/attendance/submit
// Finalises attendance. Backend should lock the record.
// ─────────────────────────────────────────────────────────────────────────────
export async function submitAttendance(payload) {
  console.log('📡 POST /api/teacher/attendance/submit', payload);
  console.log('📦 Payload contract:', {
    academicYearId: 'string',
    termId: 'string',
    scheduleId: 'string',
    classId: 'string',
    subjectId: 'string',
    periodId: 'string',
    teacherId: 'string',
    date: 'YYYY-MM-DD',
    attendances: [
      {
        studentId: 'string',
        status: 'present | absent | late',   // must NOT be null on submit
        reason: 'string',
        lateArrivalTime: 'HH:mm | empty string',
      },
    ],
  });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      attendanceId: 'string',
      status: 'submitted',
      submittedAt: 'ISO8601',
      summary: {
        total: 'number',
        present: 'number',
        absent: 'number',
        late: 'number',
      },
    },
  });

  await delay(1000);
  const summary = payload.attendances.reduce(
    (acc, a) => {
      acc.total++;
      if (a.status === 'present') acc.present++;
      else if (a.status === 'absent') acc.absent++;
      else if (a.status === 'late') acc.late++;
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0 }
  );
  return {
    success: true,
    data: {
      attendanceId: payload.attendanceId || `att_${Date.now()}`,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      summary,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/teacher/attendance/:attendanceId
// Edits a previously submitted attendance record
// ─────────────────────────────────────────────────────────────────────────────
export async function updateAttendance(attendanceId, payload) {
  console.log(`📡 PUT /api/teacher/attendance/${attendanceId}`, payload);
  console.log('📦 Payload contract:', {
    reason: 'Optional: reason for editing',
    attendances: [
      {
        studentId: 'string',
        status: 'present | absent | late',
        reason: 'string',
        lateArrivalTime: 'HH:mm | empty string',
      },
    ],
  });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      attendanceId: 'string',
      status: 'submitted',
      updatedAt: 'ISO8601',
    },
  });

  await delay(800);
  return {
    success: true,
    data: {
      attendanceId,
      status: 'submitted',
      updatedAt: new Date().toISOString(),
    },
  };
}
