import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider } from '../../timetable/TimetableContext.jsx';
import AcademicCalendarBuilder from '../../timetable/AcademicCalendarBuilder.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';

function CalendarContent() {
    useGlobalTimetableData();
    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
            <AcademicCalendarBuilder />
        </div>
    );
}

export default function CalendarPage() {
    return (
        <AdminLayout>
            <TimetableProvider>
                <CalendarContent />
            </TimetableProvider>
        </AdminLayout>
    );
}