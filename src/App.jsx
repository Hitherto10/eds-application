import React, { lazy, useEffect} from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { PWAProvider } from './contexts/PWAContext.jsx';
import { AcademicProvider } from './contexts/AcademicContext.jsx';

// Components
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import {AuthLayout} from "./components/auth/AuthLayout.jsx";
import {
    PWAInstallPrompt,
    PWAUpdateBanner,
    OfflineBanner,
    PWAInstalledToast,
} from './components/pwa';

// StandAlone Pages
const AuthPage             = lazy(() => import("./pages/auth/AuthPage.jsx"));
const CompleteRegistration = lazy(() => import("./pages/auth/UserRegistration/CompleteRegistration"));
const RegisterSchool       = lazy(() => import("./pages/auth/RegisterSchool.jsx").then(m => ({ default: m.RegisterSchool })));

// Admin Pages
const DashboardPage       = lazy(() => import("./pages/application/AdminDashboard/pages/DashboardPage.jsx"));
const TeacherManagement   = lazy(() => import("./pages/application/AdminDashboard/pages/TeacherManagement.jsx"));
const ParentManagement    = lazy(() => import("./pages/application/AdminDashboard/pages/ParentManagement.jsx"));
const StudentManagement   = lazy(() => import("./pages/application/AdminDashboard/pages/StudentManagement.jsx"));
const SchoolProfilePage   = lazy(() => import("./pages/application/AdminDashboard/pages/SchoolProfilePage.jsx"));
const AdminProfilePage    = lazy(() => import("./pages/application/AdminDashboard/pages/AdminProfilePage.jsx"));
const SubjectsPage        = lazy(() => import("./pages/application/AdminDashboard/pages/config/SubjectsPage.jsx"));
const ClassesPage         = lazy(() => import("./pages/application/AdminDashboard/pages/config/ClassesPage.jsx"));
const CalendarPage        = lazy(() => import("./pages/application/AdminDashboard/pages/config/CalendarPage.jsx"));
const TimetableLibraryPage = lazy(() => import("./pages/application/AdminDashboard/pages/config/TimetableLibraryPage.jsx"));
const TimetablePage       = lazy(() => import("./pages/application/AdminDashboard/pages/config/TimetablePage.jsx"));
const EventPage           = lazy(() => import("./pages/application/AdminDashboard/pages/config/EventPage.jsx"));
const FeeOverviewPage     = lazy(() => import("./pages/application/AdminDashboard/pages/fees/FeeOverviewPage.jsx"));
const FeeStructuresPage   = lazy(() => import("./pages/application/AdminDashboard/pages/fees/FeeStructuresPage.jsx"));
const FeeInvoicesPage     = lazy(() => import("./pages/application/AdminDashboard/pages/fees/FeeInvoicesPage.jsx"));
const FeePaymentsPage     = lazy(() => import("./pages/application/AdminDashboard/pages/fees/FeePaymentsPage.jsx"));
const FeeReportsPage      = lazy(() => import("./pages/application/AdminDashboard/pages/fees/FeeReportsPage.jsx"));

// Parent Pages
const ParentDashboard    = lazy(() => import("./pages/application/ParentDashboard/ParentDashboard.jsx"));
const ChildSelectionPage = lazy(() => import("./pages/application/ParentDashboard/MyChildren.jsx"));
const ParentProfilePage  = lazy(() => import("./pages/application/ParentDashboard/ParentProfilePage.jsx"));
const ParentFeesPage     = lazy(() => import("./pages/application/ParentDashboard/FeesAndPayments.jsx"));

// Teacher Pages
const TeacherDashboard       = lazy(() => import("./pages/application/TeacherDashboard/TeacherDashboard.jsx"));
const TeacherProfile         = lazy(() => import("./pages/application/TeacherDashboard/UserProfile.jsx"));
const ClassStudents          = lazy(() => import("./pages/application/TeacherDashboard/ClassStudents.jsx"));
const TeacherClasses         = lazy(() => import("./pages/application/TeacherDashboard/TeacherClasses.jsx"));
const AttendancePage         = lazy(() => import("./pages/application/TeacherDashboard/AttendancePage.jsx"));
const AttendanceRegisterPage = lazy(() => import("./pages/application/TeacherDashboard/AttendanceRegisterPage.jsx"));



const LoadingFallback = () => (
    <div className="h-screen w-full flex items-center justify-center font-[Outfit]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
);

/**
 * AuthContextBridge
 *
 * Makes auth context available to axios interceptors AND wires
 * clearUserCache from PWAContext so cache is cleared on logout.
 */
const AuthContextBridge = ({ children }) => {
    const auth = useAuth();

    useEffect(() => {
        window.authContext = auth;
        return () => {
            delete window.authContext;
        };
    }, [auth]);

    return children;
};


function AppRoutes() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return <LoadingFallback />;
    }

    return (
        <div className={`font-[Inter]`}>
            <React.Suspense fallback={<LoadingFallback />}>
                <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/complete-registration" element={<CompleteRegistration />} />
                <Route element={<AuthLayout />}>
                    <Route path="/register/school" element={<RegisterSchool />} />
                    <Route path="/register" element={<Navigate to="/register/school" />} />
                </Route>

                {/* Admin Protected Routes */}
                <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/school-profile" element={<ProtectedRoute requiredRole="admin"><SchoolProfilePage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/profile" element={<ProtectedRoute requiredRole="admin"><AdminProfilePage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/events-planner" element={<ProtectedRoute requiredRole="admin"><EventPage />
                </ProtectedRoute>} />
                
                {/* Users sub-routes */}
                <Route path="/dashboard/admin/users" element={<ProtectedRoute requiredRole="admin"><Navigate to="/dashboard/admin/users/teachers" replace /></ProtectedRoute>} />
                <Route path="/dashboard/admin/users/teachers" element={<ProtectedRoute requiredRole="admin"><TeacherManagement /></ProtectedRoute>} />
                <Route path="/dashboard/admin/users/parents" element={<ProtectedRoute requiredRole="admin"><ParentManagement /></ProtectedRoute>} />
                <Route path="/dashboard/admin/users/students" element={<ProtectedRoute requiredRole="admin"><StudentManagement /></ProtectedRoute>} />
                
                {/* Fees sub-routes — each is its own page */}
                <Route path="/dashboard/admin/fees" element={<ProtectedRoute requiredRole="admin"><Navigate to="/dashboard/admin/fees/overview" replace /></ProtectedRoute>} />
                <Route path="/dashboard/admin/fees/overview"    element={<ProtectedRoute requiredRole="admin"><FeeOverviewPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/fees/structures"  element={<ProtectedRoute requiredRole="admin"><FeeStructuresPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/fees/invoices"    element={<ProtectedRoute requiredRole="admin"><FeeInvoicesPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/fees/payments"    element={<ProtectedRoute requiredRole="admin"><FeePaymentsPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/fees/reports"     element={<ProtectedRoute requiredRole="admin"><FeeReportsPage /></ProtectedRoute>} />

                {/* Config sub-routes — each is its own page */}
                <Route path="/dashboard/admin/config" element={<ProtectedRoute requiredRole="admin"><Navigate to="/dashboard/admin/config/subjects" replace /></ProtectedRoute>} />
                <Route path="/dashboard/admin/config/subjects"  element={<ProtectedRoute requiredRole="admin"><SubjectsPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/config/classes"   element={<ProtectedRoute requiredRole="admin"><ClassesPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/config/calendar"  element={<ProtectedRoute requiredRole="admin"><CalendarPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/timetable-library" element={<ProtectedRoute requiredRole="admin"><TimetableLibraryPage /></ProtectedRoute>} />
                <Route path="/dashboard/admin/config/timetable" element={<ProtectedRoute requiredRole="admin"><TimetablePage /></ProtectedRoute>} />

                {/* Parent Protected Routes */}
                <Route path="/dashboard/parent" element={<ProtectedRoute requiredRole="parent"><ParentDashboard /></ProtectedRoute>}/>
                <Route path="/dashboard/parent/children" element={<ProtectedRoute requiredRole="parent"><ChildSelectionPage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/fees" element={<ProtectedRoute requiredRole="parent"><ParentFeesPage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/profile" element={<ProtectedRoute requiredRole="parent"><ParentProfilePage /></ProtectedRoute>} />

                {/* Teacher Protected Routes */}
                <Route path="/dashboard/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/profile" element={<ProtectedRoute requiredRole="teacher"><TeacherProfile /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/classes" element={<ProtectedRoute requiredRole="teacher"><TeacherClasses /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/students/:class/:subject" element={<ProtectedRoute requiredRole="teacher"><ClassStudents /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/attendance" element={<ProtectedRoute requiredRole="teacher"><AttendancePage /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/attendance/register/:scheduleId" element={<ProtectedRoute requiredRole="teacher"><AttendanceRegisterPage /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />

                </Routes>
            </React.Suspense>

            <PWAUpdateBanner />
            <PWAInstallPrompt />
            <OfflineBanner />
            <PWAInstalledToast />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <PWAProvider>
                <AuthContextBridge>
                    <AcademicProvider>
                        <AppRoutes />
                    </AcademicProvider>
                </AuthContextBridge>
            </PWAProvider>
        </AuthProvider>
    );
}

export default App;