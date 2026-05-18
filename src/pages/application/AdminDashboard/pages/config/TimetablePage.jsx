import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { TimetableProvider, useTimetable } from '../../timetable/TimetableContext.jsx';
import TimetableBuilder from '../../timetable/TimetableBuilder.jsx';
import { useGlobalTimetableData } from '../../timetable/useGlobalTimetableData.js';

/**
 * TimetablePage
 * Route: /dashboard/admin/config/timetable
 *
 * Renders the drag-and-drop timetable builder with its class/term context bar.
 * Data loading is handled by useGlobalTimetableData.
 */
function TimetableContent() {
    const { state, dispatch } = useTimetable();
    const { initialLoad, handleYearChange } = useGlobalTimetableData();

    if (initialLoad) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 h-full">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Booting Academic Engine...</p>
            </div>
        );
    }

    console.log("TimetableContent:", state.selectedYear, state.selectedTerm, state.selectedClass);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
            {/* Class / Term context bar */}
            <div className="flex flex-wrap shadow-sm items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg mb-4 shrink-0 overflow-visible z-10">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Target Class</span>
                    <select
                        value={state.selectedClass?.id || ''}
                        onChange={e => {
                            const c = state.classes.find(x => x.id === e.target.value);
                            dispatch({ type: 'SELECT_CLASS', payload: c });
                        }}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">-- Choose Class --</option>
                        {state.classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-6 bg-gray-200 hidden md:block" />

                <div className="flex flex-wrap items-center gap-3">
                    {/* Academic year selector — change triggers sequential term reload via handleYearChange */}
                    <select
                        value={state.selectedYear?.id || ''}
                        onChange={e => handleYearChange(e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        {state.academicYears.map(y => (
                            <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>
                        ))}
                    </select>

                    <div className="w-px h-5 bg-gray-200 hidden md:block" />

                    {/* Term selector — populated after year is resolved */}
                    <select
                        value={state.selectedTerm?.id || ''}
                        onChange={e => {
                            const t = state.terms.find(x => x.id === e.target.value);
                            if (t) dispatch({ type: 'SELECT_TERM', payload: t });
                        }}
                        disabled={state.loading.terms || state.terms.length === 0}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    >
                        {state.terms.map(t => (
                            <option key={t.id} value={t.id}>{t.name}{t.isCurrent ? ' (Current)' : ''}</option>
                        ))}
                    </select>
                </div>

                {state.loading.draft && (
                    <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-400">
                        <Loader2 size={12} className="animate-spin" /> Fetching data...
                    </div>
                )}
            </div>

            {/* Builder */}
            <div className="flex-1 overflow-hidden">
                <TimetableBuilder />
            </div>
        </div>
    );
}

export default function TimetablePage() {
    return (
        <AdminLayout>
            <TimetableProvider>
                <TimetableContent />
            </TimetableProvider>
        </AdminLayout>
    );
}