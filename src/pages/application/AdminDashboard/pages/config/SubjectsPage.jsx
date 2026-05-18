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
    const { initialLoad } = useGlobalTimetableData();

    if (initialLoad) {
        return (
            <div className="flex flex-col items-center h-full justify-center py-32">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Subject Setup...</p>
            </div>
        );
    }

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