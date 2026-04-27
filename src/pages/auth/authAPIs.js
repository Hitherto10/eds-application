import apiClient from '../../utils/axiosConfig';

export async function RegSchool(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/register', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function LoginSchool(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/login', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function LoginUser(payload) {
    try {
        const { data } = await apiClient.post('/api/user/auth/login', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getStudentInfo(studentId) {
    try {
        const { data } = await apiClient.get(`/api/parent/children/${studentId}`);
        return data.data.children[0];
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getParentProfile() {
    try {
        const { data } = await apiClient.get(`/api/parent/profile`);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function verifyOTP(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/verify-email', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function resendOTP(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/resend-otp', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getDashboardAnalytics() {
    try {
        const { data } = await apiClient.get('/api/admin/dashboard/analytics');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getParentDashboard() {
    try {
        const { data } = await apiClient.get('/api/parent/dashboard');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getTeacherDashboard() {
    try {
        const { data } = await apiClient.get('/api/teacher/dashboard');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getTeacherClasses() {
    try {
        const { data } = await apiClient.get('/api/teacher/classes');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getTeacherStudents() {
    try {
        const { data } = await apiClient.get('/api/teacher/students');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getSubjectsByClass(className) {

    try {
        const { data } = await apiClient.get(`/api/teacher/classes/${className}/subjects`);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getStudentsByClassandSubject(className, subjectName) {
    try {
        const { data } = await apiClient.get(`/api/teacher/classes/${className}/subjects/${subjectName}/students`);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function assignGrade(payload) {
    try {
        const { data } = await apiClient.post(`/api/teacher/grades`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function publishGrade(payload) {
    try {
        const { data } = await apiClient.post(`/api/teacher/grades/publish`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function updateGrade(payload, gradeId) {
    try {
        const { data } = await apiClient.put(`/api/teacher/grades/${gradeId}`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function viewGrade(studentId) {
    try {
        const { data } = await apiClient.get(`/api/teacher/students/${studentId}/grades`);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getDashboardUsers(role = '', status = '') {
    try {
        const { data } = await apiClient.get('/api/admin/dashboard/users', {
            params: {

                role: role || undefined,
                status: status || undefined
            }
        });
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function inviteTeacher(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/invite-teacher', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function inviteParent(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/invite-parent', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getInvitations() {
    try {
        const { data } = await apiClient.get('/api/school/auth/invitations?status=pending');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function resendInvitation(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/resend-invitation', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function terminateInvitation(payload) {
    try {
        const { data } = await apiClient.post('/api/school/auth/cancel-invitation', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getAllStudents() {
    try {
        const { data } = await apiClient.get('/api/students');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getAllParents() {
    try {
        const { data } = await apiClient.get('/api/parent-management/parents');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function getSchoolProfile() {
    try {
        const { data } = await apiClient.get('/api/school/profile');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function createStudent(payload) {
    try {
        const { data } = await apiClient.post('/api/students', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function deactivateSchool(payload) {
    try {
        const { data } = await apiClient.post('/api/school/profile/status', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function reactivateSchool(payload) {
    try {
        const { data } = await apiClient.post('/api/school/profile/status', payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function verifySession() {
    try {
        const { data } = await apiClient.get('/api/user/auth/me');
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function updateStudent(studentId, payload) {
    try {
        const { data } = await apiClient.put(`/api/students/${studentId}`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function updateSchool(payload) {
    try {
        const { data } = await apiClient.put(`/api/school/profile`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function toggleStatus(payload) {
    try {
        const { data } = await apiClient.post(`/api/admin/dashboard/users/toggle-status`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function toggleStudentStatus(payload) {
    try {
        const { data } = await apiClient.post(`/api/students/toggle-status`, payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function deleteUser(payload) {
    try {
        const { data } = await apiClient.delete(`/api/admin/dashboard/users/remove`, {data: payload});
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function deleteStudent(payload) {
    try {
        const { data } = await apiClient.delete(`/api/students/remove`, {data: payload});
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function deleteGrade(payload, studentId) {
    try {
        const { data } = await apiClient.delete(`/api/teacher/grades/${studentId}`, {data: payload});
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function deleteClasses(payload) {
    try {
        const { data } = await apiClient.delete(`/api/admin/teachers/remove-classes`, {data: payload});
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function linkStudentToParent(payload, parentId) {
    try {
        const { data } = await apiClient.post(`/api/parent-management/parents/${parentId}/link-students`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function unlinkStudentToParent(payload, parentId) {
    try {
        const { data } = await apiClient.post(`/api/parent-management/parents/${parentId}/unlink-students`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function assignSubjects(payload) {
    try {
        const { data } = await apiClient.post(`/api/admin/teachers/assign-subjects`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function completeRegistration(payload) {
    try {
        const { data } = await apiClient.post(`/api/user/auth/complete-registration`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function assignStudenttoTeacher(payload) {
    // expected payload:
    // {
    //     "teacherId": "6962b912fa5cba86752091ff",
    //     "studentIds": ["6961b35ac534684284150259"],
    //     "schoolId": "FED9474"
    // }
    //
    try {
        const { data } = await apiClient.post(`/api/admin/assign-teacher`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function bulkAssignStudentToTeacher(payload) {
    try {
        const { data } = await apiClient.post(`/api/admin/assign-teachers-bulk`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function unassignStudentToTeacher(payload) {
    try {
        const { data } = await apiClient.post(`/api/admin/unassign-teacher`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function assignClasses(payload) {
    try {
        const { data } = await apiClient.post(`/api/admin/teachers/assign-classes`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function updateParentProfile(payload) {
    try {
        const { data } = await apiClient.put(`/api/parent/profile`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

export async function updateAdminProfile(payload) {
    try {
        const { data } = await apiClient.put(`/api/school/profile/admin`,
            payload);
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}

// =========================
// Attendance APIs
// =========================


/*
Expected Input (payload):

{
  attendances: [
    {
      academicYearId: "70abc...",
      termId: "71abc...",
      classId: "69ed...",
      studentId: "60abc...",
      date: "2025-09-15",
      status: "present" // present | absent | late | excused
      reason: "Medical" // optional, used for absent/excused
    }
  ]
}

Expected Output:

{
  success: true,
  message: "10 attendance record(s) marked successfully",
  data: {...}
}
*/
export async function markAttendance(payload) {
    try {
        const { data } = await apiClient.post(
            `/api/attendance/mark`,
            payload
        );
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}



/*
Expected Input:

studentId: "60abc..."
days: 30 (optional, defaults to 30)

Example request:
getStudentAttendance("60abc...", 30)


Expected Output:

{
  success: true,
  data: {
    attendance: [...],
    total: 25,
    present: 22,
    absent: 2,
    late: 1,
    excused: 0
  }
}
*/
export async function getStudentAttendance(studentId, days = 30) {
    try {
        const { data } = await apiClient.get(
            `/api/attendance/student/${studentId}?days=${days}`
        );
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}



/*
Expected Input:

classId: "69ed..."
date: "2025-09-15"

Example:
getClassAttendance("69ed...", "2025-09-15")


Expected Output:

{
  success: true,
  data: {
    date: "2025-09-15",
    totalStudents: 45,
    present: 40,
    absent: 3,
    late: 2,
    excused: 0,
    records: [...]
  }
}
*/
export async function getClassAttendance(classId, date) {
    try {
        const { data } = await apiClient.get(
            `/api/attendance/class/${classId}?date=${date}`
        );
        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}



/*
Expected Input:

{
  classId: "69ed...",
  startDate: "2025-09-01",
  endDate: "2025-12-01"
}

Example:
getAttendanceStats({
   classId,
   startDate,
   endDate
})


Expected Output:

{
  success: true,
  data: {
    classId: "69ed...",
    totalStudents: 45,
    averageAttendance: 92.5,
    byStatus: {
      present: 828,
      absent: 45,
      late: 27,
      excused: 3
    }
  }
}
*/
export async function getAttendanceStats(params) {
    try {
        const { classId, startDate, endDate } = params;

        const { data } = await apiClient.get(
            `/api/attendance/stats?classId=${classId}&startDate=${startDate}&endDate=${endDate}`
        );

        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}



/*
Expected Input:

classId: "69ed..."
threshold: 3 (optional)

Example:
getChronicAbsentees("69ed...", 3)


Expected Output:

{
  success: true,
  data: {
    students: [
      {
        studentId: "60abc...",
        firstName: "John",
        lastName: "Doe",
        absentCount: 5,
        attendanceRate: 85.0
      }
    ],
    total: 2
  }
}
*/
export async function getChronicAbsentees(classId, threshold = 3) {
    try {
        const { data } = await apiClient.get(
            `/api/attendance/chronic/absent?classId=${classId}&threshold=${threshold}`
        );

        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}



/*
Expected Input:

classId: "69ed..."
threshold: 2 (optional)

Example:
getChronicLateStudents("69ed...", 2)


Expected Output:

{
  success: true,
  data: {
    students: [...],
    total: 3
  }
}
*/
export async function getChronicLateStudents(classId, threshold = 2) {
    try {
        const { data } = await apiClient.get(
            `/api/attendance/chronic/late?classId=${classId}&threshold=${threshold}`
        );

        return data;
    } catch (error) {
        throw error?.response?.data || error;
    }
}






