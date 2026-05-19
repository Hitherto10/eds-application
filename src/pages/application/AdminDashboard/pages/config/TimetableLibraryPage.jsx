import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, LayoutGrid, CheckCircle2, CalendarDays, Plus, Filter, Search, ChevronRight, BookOpen, User, Clock, MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import AdminLayout from "../../components/layout/AdminLayout.jsx";
import { getPublishedTimetable, getAcademicProfile, getTerms } from '../../timetable/timetableAPIs.js';
import { getSchoolClasses } from '../../services/classAPIs.js';
import { getClassArms } from '../../services/armAPIs.js';
import { getSubjectColor } from '../../timetable/TimetableContext.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// ─── Time math helpers ────────────────────────────────────────────────────────
const addMinutesToTime = (timeStr, minsToAdd) => {
    if (!timeStr) return '';
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins + minsToAdd);
    return date.toTimeString().slice(0, 5);
};

function TimetableLibrary() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse query params for pre-selection
    const queryParams = new URLSearchParams(location.search);
    const preClassId = queryParams.get('classId');
    const preTermId = queryParams.get('termId');
    const preArmId = queryParams.get('armId');

    // Selection state
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [selectedArm, setSelectedArm] = useState(null);

    // Data state
    const [classes, setClasses] = useState([]);
    const [terms, setTerms] = useState([]);
    const [arms, setArms] = useState([]);
    const [timetable, setTimetable] = useState(null);
    
    // UI state
    const [loading, setLoading] = useState({ init: true, arms: false, timetable: false });
    const [error, setError] = useState(null);

    // Initial load: classes and terms (via current academic year)
    useEffect(() => {
        async function fetchInitialData() {
            setLoading(prev => ({ ...prev, init: true }));
            try {
                const [profileRes, classesRes] = await Promise.all([
                    getAcademicProfile(),
                    getSchoolClasses()
                ]);

                let loadedTerms = [];
                if (profileRes.success && profileRes.data?.currentAcademicYear?.id) {
                    const termsRes = await getTerms(profileRes.data.currentAcademicYear.id);
                    if (termsRes.success) {
                        loadedTerms = termsRes.data.terms || [];
                        setTerms(loadedTerms);
                    }
                }

                let loadedClasses = [];
                if (classesRes.success) {
                    loadedClasses = classesRes.data.classes || [];
                    setClasses(loadedClasses);
                }

                // Apply pre-selection from query params if available
                if (preClassId) {
                    const foundClass = loadedClasses.find(c => c.id === preClassId);
                    if (foundClass) setSelectedClass(foundClass);
                }
                
                if (preTermId) {
                    const foundTerm = loadedTerms.find(t => t.id === preTermId);
                    if (foundTerm) setSelectedTerm(foundTerm);
                } else {
                    // Auto-select current term if no pre-selection
                    const current = loadedTerms.find(t => t.isCurrent);
                    if (current) setSelectedTerm(current);
                }

            } catch (err) {
                console.error("Failed to load initial library data:", err);
                setError("Failed to load school configuration. Please try again.");
            } finally {
                setLoading(prev => ({ ...prev, init: false }));
            }
        }
        fetchInitialData();
    }, [preClassId, preTermId]);

    // Fetch arms when class changes
    useEffect(() => {
        if (!selectedClass) {
            setArms([]);
            setSelectedArm(null);
            return;
        }

        async function fetchArms() {
            setLoading(prev => ({ ...prev, arms: true }));
            try {
                const res = await getClassArms(selectedClass.id);
                if (res.success) {
                    const loadedArms = res.data.arms || [];
                    setArms(loadedArms);
                    
                    // Handle pre-selected arm
                    if (preArmId) {
                        const foundArm = loadedArms.find(a => a.id === preArmId);
                        if (foundArm) setSelectedArm(foundArm);
                    } else {
                        setSelectedArm(null);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch arms:", err);
            } finally {
                setLoading(prev => ({ ...prev, arms: false }));
            }
        }
        fetchArms();
    }, [selectedClass, preArmId]);

    // Fetch timetable when parameters are set
    useEffect(() => {
        if (!selectedClass || !selectedTerm) {
            setTimetable(null);
            return;
        }

        async function fetchTimetable() {
            setLoading(prev => ({ ...prev, timetable: true }));
            setError(null);
            try {
                const res = await getPublishedTimetable(selectedClass.id, selectedTerm.id, selectedArm?.id);
                if (res.success) {
                    setTimetable(res.data?.timetable || null);
                } else {
                    setTimetable(null);
                }
            } catch (err) {
                console.error("Failed to fetch timetable:", err);
                setError("Could not retrieve timetable. It might not be published yet.");
                setTimetable(null);
            } finally {
                setLoading(prev => ({ ...prev, timetable: false }));
            }
        }
        fetchTimetable();
    }, [selectedClass, selectedTerm, selectedArm]);

    // Derived: Expanded Periods from config
    const generatedPeriods = useMemo(() => {
        if (!timetable?.periods?.[0]) return [];
        const config = timetable.periods[0];
        const { schoolStart, totalPeriods, periodDuration, breaks } = config;
        
        let currentStartTime = schoolStart;
        const result = [];
        
        for (let i = 1; i <= totalPeriods; i++) {
            const endTime = addMinutesToTime(currentStartTime, periodDuration);
            result.push({
                id: `p_${i}`,
                number: i,
                label: `Period ${i}`,
                start: currentStartTime,
                end: endTime,
                isBreak: false
            });
            currentStartTime = endTime;

            // Check for breaks after this period
            const breakFound = breaks?.find(b => b.breakAfter === i);
            if (breakFound) {
                const breakEndTime = addMinutesToTime(currentStartTime, breakFound.breakDuration);
                result.push({
                    id: `b_${i}`,
                    label: breakFound.label || 'Break',
                    start: currentStartTime,
                    end: breakEndTime,
                    isBreak: true
                });
                currentStartTime = breakEndTime;
            }
        }
        return result;
    }, [timetable]);

    // Derived: Schedule Map for easy lookup
    const scheduleMap = useMemo(() => {
        if (!timetable?.schedules) return {};
        const map = {};
        timetable.schedules.forEach(s => {
            const key = `${s.dayOfWeek}__${s.periodNumber}`;
            if (!map[key]) map[key] = [];
            map[key].push(s);
        });
        return map;
    }, [timetable]);

    if (loading.init) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Timetable Library
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Search and view published school timetables.</p>
                </div>
            </div>

            {/* Selection Bar */}
            <div className="bg-white border border-gray-200 rounded-xs p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Class Selection */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-gray-700 tracking-widest ml-1">Class Level</label>
                    <select 
                        value={selectedClass?.id || ''} 
                        onChange={(e) => setSelectedClass(classes.find(c => c.id === e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                        <option value="">Select Class...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Term Selection */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-gray-700 tracking-widest ml-1">Academic Term</label>
                    <select 
                        value={selectedTerm?.id || ''} 
                        onChange={(e) => setSelectedTerm(terms.find(t => t.id === e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                        <option value="">Select Term...</option>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.isCurrent ? '(Current)' : ''}</option>)}
                    </select>
                </div>

                {/* Arm Selection */}
                <div className="space-y-1.5 relative">
                    <label className="text-[10px] uppercase text-gray-700 tracking-widest ml-1">Arm / Section (Optional)</label>
                    <div className="relative">
                        <select 
                            value={selectedArm?.id || ''} 
                            onChange={(e) => setSelectedArm(arms.find(a => a.id === e.target.value))}
                            disabled={!selectedClass || arms.length === 0}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                        >
                            <option value="">{arms.length > 0 ? 'All Arms / Select Arm...' : 'No arms available'}</option>
                            {arms.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        {loading.arms && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                </div>

                {/* Reset/Status */}
                <div className="flex items-end pb-0.5">
                    {timetable && (
                        <div className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium w-full animate-in slide-in-from-left-2">
                            <CheckCircle2 size={14} />
                            <span>Published on {new Date(timetable.publishedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {loading.timetable ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <p className="text-gray-500 font-medium">Fetching timetable data...</p>
                    </div>
                ) : !selectedClass || !selectedTerm ? (
                    <div className="text-center bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-20">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Start your search</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">Select a class and term above to view the corresponding published timetable.</p>
                    </div>
                ) : !timetable ? (
                    <div className="text-center bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-20">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Timetable not found</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                            {selectedArm 
                                ? `No published timetable found for ${selectedClass.name} — ${selectedArm.name}.`
                                : `No published timetable found for ${selectedClass.name} ${arms.length > 0 ? ", try selecting an Arm" : ""}.`}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/admin/config/timetable')}
                            className="mt-6 text-blue-600 font-semibold text-sm hover:underline"
                        >
                            Go to Builder to create one
                        </button>
                    </div>
                ) : (
                    /* The Timetable Grid */
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-4 border-r border-gray-200 w-[120px]">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time / Day</span>
                                        </th>
                                        {DAYS.map(day => (
                                            <th key={day} className="p-4 border-r border-gray-200 text-sm font-bold text-gray-700 text-center min-w-[180px]">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedPeriods.map(period => (
                                        <tr key={period.id} className={`border-b border-gray-100 ${period.isBreak ? 'bg-gray-50/50' : ''}`}>
                                            {/* Time Column */}
                                            <td className="p-3 border-r border-gray-200 bg-gray-50/30">
                                                <div className="flex flex-col items-center justify-center">
                                                    {period.isBreak ? (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{period.label}</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs font-bold text-gray-800">Period {period.number}</span>
                                                            <span className="text-[10px] text-gray-500 font-medium mt-0.5 whitespace-nowrap">{period.start} - {period.end}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Data Columns */}
                                            {period.isBreak ? (
                                                <td colSpan={5} className="p-3">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <div className="h-px bg-gray-200 flex-1" />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{period.label}</span>
                                                        <div className="h-px bg-gray-200 flex-1" />
                                                    </div>
                                                </td>
                                            ) : (
                                                DAYS.map(day => {
                                                    const key = `${day}__${period.number}`;
                                                    const slots = scheduleMap[key] || [];
                                                    
                                                    return (
                                                        <td key={day} className="p-2 border-r border-gray-100 align-top min-h-[100px]">
                                                            <div className="space-y-2">
                                                                {slots.length === 0 ? (
                                                                    <div className="h-16 flex items-center justify-center border border-dashed border-gray-100 rounded-lg">
                                                                        <span className="text-[10px] text-gray-300 font-medium italic">Free</span>
                                                                    </div>
                                                                ) : (
                                                                    slots.map(slot => {
                                                                        const color = getSubjectColor(slot.subjectId);
                                                                        return (
                                                                            <div key={slot.id} className={`p-3 rounded-xl ${color.bg} ${color.border} ${color.text} shadow-sm group hover:shadow-md transition-all`}>
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <h4 className="font-bold text-xs leading-tight line-clamp-2">{slot.subjectName}</h4>
                                                                                </div>
                                                                                
                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                                        <User size={10} />
                                                                                        <span className="text-[9px] font-bold truncate">{slot.teacherName}</span>
                                                                                    </div>
                                                                                    {slot.roomName && (
                                                                                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                                            <MapPin size={10} />
                                                                                            <span className="text-[9px] font-medium">{slot.roomName}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                                        <Clock size={10} />
                                                                                        <span className="text-[9px] font-medium">{slot.startTime} - {slot.endTime}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Footer Info */}
                        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 font-medium">
                            <div className="flex gap-4">
                                <span>Periods: {timetable.periods?.[0]?.totalPeriods || 0}</span>
                                <span>Duration: {timetable.periods?.[0]?.periodDuration || 0} mins</span>
                                <span>Total Slots: {timetable.schedules?.length || 0}</span>
                            </div>
                            <div>
                                Published {new Date(timetable.publishedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
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
