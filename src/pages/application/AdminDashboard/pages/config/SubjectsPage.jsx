import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider } from '../../timetable/TimetableContext.jsx';
import SubjectSetupBuilder from '../../timetable/components/SubjectSetupBuilder.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';

/**
 * SubjectsPage
 * Route: /dashboard/admin/config/subjects
 *
 * Wraps SubjectSetupBuilder in its own page. The TimetableProvider supplies
 * global context (subjects, classes, etc.) to the builder.
 */
function SubjectsContent() {
    // Kick off global data load (years, classes, teachers, subjects)
    useGlobalTimetableData();
    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
            <SubjectSetupBuilder />
        </div>
    );
}

export default function SubjectsPage() {
    return (
        <AdminLayout>
            <TimetableProvider>
                <SubjectsContent />
            </TimetableProvider>
        </AdminLayout>
    );
}