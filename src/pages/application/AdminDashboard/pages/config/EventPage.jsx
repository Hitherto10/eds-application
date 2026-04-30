import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider } from '../../timetable/TimetableContext.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';
import EventPlanner from "./EventPlanner.jsx";

function EventContent() {
    useGlobalTimetableData();
    return (
        <EventPlanner />
    );
}

export default function EventPage() {
    return (
        <AdminLayout>
            <TimetableProvider>
                <EventContent />
            </TimetableProvider>
        </AdminLayout>
    );
}