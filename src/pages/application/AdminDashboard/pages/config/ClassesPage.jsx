import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider } from '../../timetable/TimetableContext.jsx';
import ClassSetupBuilder from '../../timetable/components/ClassSetupBuilder.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';

function ClassesContent() {
    useGlobalTimetableData();
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