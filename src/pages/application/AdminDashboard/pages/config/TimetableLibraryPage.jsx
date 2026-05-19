import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutGrid, FileEdit, CheckCircle2, CalendarDays, Plus } from 'lucide-react';
// import {getAllTimetables} from "../../timetable/timetableAPIs.js";
import AdminLayout from "../../components/layout/AdminLayout.jsx";
// import AdminLayout from '../../../components/layout/AdminLayout.jsx';
// import { getAllTimetables } from '../../../timetable/timetableAPIs.js';

function TimetableLibrary() {
    const navigate = useNavigate();
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     async function fetchLibrary() {
    //         setLoading(true);
    //         try {
    //             const res = await getAllTimetables();
    //             if (res?.success) {
    //                 setTimetables(res.data?.timetables || []);
    //             }
    //         } catch (err) {
    //             console.error(err);
    //         } finally {
    //             setLoading(false);
    //         }
    //     }
    //     fetchLibrary();
    // }, []);

    const drafts = timetables.filter(t => !t.published);
    const published = timetables.filter(t => t.published);

    const TimetableCard = ({ t }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-gray-900">{t.className} {t.armName ? `— ${t.armName}` : ''}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t.termName} • {t.academicYearName}</p>
                </div>
                {t.published ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Published
                    </span>
                ) : (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full flex items-center gap-1">
                        <FileEdit size={12} /> Draft
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1.5">
                    <LayoutGrid size={14} className="text-gray-400" />
                    <span>{t.schedulesCount || 0} slots</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span>Updated {new Date(t.updatedAt || t.publishedAt || Date.now()).toLocaleDateString()}</span>
                </div>
            </div>

            <button
                onClick={() => {
                    let url = `/dashboard/admin/config/timetable?classId=${t.classId}&termId=${t.termId}&yearId=${t.academicYearId}`;
                    if (t.armId) url += `&armId=${t.armId}`;
                    navigate(url);
                }}
                className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-blue-600 font-semibold text-sm rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
            >
                {t.published ? 'View Timetable' : 'Continue Editing'}
            </button>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Timetable Library</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and view your draft and published timetables.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/admin/config/timetable')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={16} /> Create New Timetable
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : timetables.length === 0 ? (
                <div className="text-center bg-gray-50 border border-gray-200 border-dashed rounded-xl p-12">
                    <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No timetables found</h3>
                    <p className="text-gray-500 mt-2 mb-6">You haven't created any timetables yet.</p>
                    <button
                        onClick={() => navigate('/dashboard/admin/config/timetable')}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                        <Plus size={16} /> Create Your First Timetable
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {drafts.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileEdit className="w-5 h-5 text-amber-500" />
                                Draft Timetables
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {drafts.map(t => <TimetableCard key={t.id} t={t} />)}
                            </div>
                        </div>
                    )}

                    {published.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                Published Timetables
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {published.map(t => <TimetableCard key={t.id} t={t} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TimetableLibraryPage() {
    return (
        <AdminLayout>
            <TimetableLibrary />
        </AdminLayout>
    );
}
