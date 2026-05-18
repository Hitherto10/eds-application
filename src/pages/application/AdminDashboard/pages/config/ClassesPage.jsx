import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider } from '../../timetable/TimetableContext.jsx';
import ClassSetupBuilder from '../../timetable/components/ClassSetupBuilder.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';

function ClassesContent() {
    const { initialLoad } = useGlobalTimetableData();

    if (initialLoad) {
        return (
            <div className="flex flex-col items-center h-full justify-center py-32">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Class Setup...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
            <ClassSetupBuilder />
        </div>
    );
}

export default function ClassesPage() {
    return (
        <AdminLayout>
            <TimetableProvider>
                <ClassesContent />
            </TimetableProvider>
        </AdminLayout>
    );
}