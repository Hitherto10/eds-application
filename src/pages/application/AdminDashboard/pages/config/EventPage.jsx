import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider } from '../../timetable/TimetableContext.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';
import EventPlanner from "./EventPlanner.jsx";

function EventContent() {
    const { initialLoad } = useGlobalTimetableData();

    if (initialLoad) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Event Planner...</p>
            </div>
        );
    }

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