import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import AcademicCalendarBuilder from "../../timetable/AcademicCalendarBuilder.jsx";

export default function CalendarPage() {
    return (
        <AdminLayout>
            <div className="flex flex-col h-full overflow-hidden">
                <AcademicCalendarBuilder />
            </div>
        </AdminLayout>
    );
}
