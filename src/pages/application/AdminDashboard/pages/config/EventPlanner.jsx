import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../timetable/TimetableContext';
import { Trash2, AlertCircle,ChevronLeft, ChevronRight } from 'lucide-react';
import { getAcademicProfile, createEvent, deleteEvent } from '../../timetable/timetableAPIs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter
} from '../../../../../components/ui/alert-dialog';

export default function EventPlanner() {
    const { state, dispatch } = useTimetable();

    // Local state for active context (fetched from profile)
    const [activeProfile, setActiveProfile] = useState({
        currentYear: null,
        currentTerm: null,
        isLoading: true
    });

    // UI State
    const [selectedViewYearId, setSelectedViewYearId] = useState(null);

    // Forms
    const currentYearNum = new Date().getFullYear();

    // Calendar State
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDateMsg, setSelectedDateMsg] = useState(null);
    const [eventForm, setEventForm] = useState({ name: '', type: 'holiday' });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCalendarTermId, setSelectedCalendarTermId] = useState(null);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

    // Fetch Academic Profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getAcademicProfile();
            if (res.success && res.data?.school) {
                setActiveProfile({
                    currentYear: res.data.school.currentAcademicYear || null,
                    currentTerm: res.data.school.currentTerm || null,
                    isLoading: false
                });
            }
        } catch (e) {
            console.error("Failed to fetch academic profile", e);
            setActiveProfile(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Set selected view year initially if none selected
    useEffect(() => {
        if (!selectedViewYearId && state.academicYears.length > 0) {
            // Prefer active year, then most recent
            const active = activeProfile.currentYear?.id;
            if (active && state.academicYears.some(y => y.id === active)) {
                setSelectedViewYearId(active);
            } else {
                setSelectedViewYearId(state.academicYears[state.academicYears.length - 1].id);
            }
        }
    }, [state.academicYears, activeProfile.currentYear, selectedViewYearId]);

    // --- Handlers ---

    const handleDateClick = (dateObj) => {
        // if (!selectedCalendarTermId) return alert('Select a term for the calendar first to add events.');
        const dateStr = dateObj.toISOString().split('T')[0];
        setSelectedDateMsg(dateStr);
        setShowEventModal(true);
    };

    const handleCreateEvent = async () => {
        const payload = {
            termId: selectedCalendarTermId,
            name: eventForm.name,
            type: eventForm.type,
            date: selectedDateMsg
        };
        const res = await createEvent(payload);
        if (res.success) {
            dispatch({ type: 'ADD_EVENT', payload: res.data.event });
            setShowEventModal(false);
            setEventForm({ name: '', type: 'holiday' });
        }
    };

    const handleDeleteEvent = async (id, e) => {
        e.stopPropagation();
        if(confirm('Delete this event?')) {
            const res = await deleteEvent(id);
            if(res.success) dispatch({ type: 'REMOVE_EVENT', id });
        }
    };

    const getEventsForDate = (dateObj) => {
        if (!dateObj) return [];
        const dStr = dateObj.toISOString().split('T')[0];
        return state.events.filter(h => h.date === dStr && h.termId === selectedCalendarTermId);
    };


    return (
        <div className="flex flex-col gap-8 bg-gray-50/50 max-w-[1600px] mx-auto w-full ">
            {/* Header & System Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Academic Context Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configure and manage academic years, terms, and system-wide active sessions.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-8">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">CURRENT ACADEMIC YEAR</p>
                        {activeProfile.currentYear ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-gray-900">{activeProfile.currentYear.name}</span>
                                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Active</span>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-amber-600 flex items-center gap-1"><AlertCircle size={14}/> Not Set</span>
                        )}
                    </div>

                    <div className="hidden sm:block w-px bg-gray-200 h-10"></div>

                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">CURRENT TERM</p>
                        {activeProfile.currentTerm ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-gray-900">{activeProfile.currentTerm.name}</span>
                                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Active</span>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-amber-600 flex items-center gap-1"><AlertCircle size={14}/> Not Set</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Events Calendar Section */}
            <div className="bg-white max-w-7xl col-span-2 rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col w-full mt-2">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50 flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Events Calendar - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-4 flex-wrap">
                        <select
                            value={selectedCalendarTermId || ''}
                            onChange={e => {
                                setSelectedCalendarTermId(e.target.value);
                                dispatch({ type: 'SELECT_TERM', payload: state.terms.find(t => t.id === e.target.value) });
                            }}
                            className="p-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                        >
                            <option value="">-- Select Term for Events --</option>
                            {state.terms.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({state.academicYears.find(y => y.id === t.academicYearId)?.name})</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-100"><ChevronLeft size={20} /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold rounded bg-white border border-gray-200 hover:bg-gray-100">Today</button>
                            <button onClick={nextMonth} className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-100"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="p-3 text-center text-sm font-bold text-gray-500 uppercase">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
                    {days.map((dateObj, idx) => {
                        if (!dateObj) return <div key={idx} className="border-r border-b border-gray-100 bg-gray-50/50 min-h-[120px]" />;

                        const isToday = [dateObj.getDate(), dateObj.getMonth(), dateObj.getFullYear()].join() ===
                            [new Date().getDate(), new Date().getMonth(), new Date().getFullYear()].join();

                        const events = getEventsForDate(dateObj);

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDateClick(dateObj)}
                                className={`border-r border-b border-gray-100 min-h-[120px] p-2 hover:bg-blue-50/30 cursor-pointer transition flex flex-col group ${isToday ? 'bg-blue-50/10' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                   <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700 group-hover:text-blue-600'}`}>
                     {dateObj.getDate()}
                   </span>
                                </div>

                                <div className="flex-1 space-y-1 overflow-y-auto">
                                    {events.map(ev => {
                                        let colors = 'bg-gray-100 text-gray-800 border-gray-200';
                                        if (ev.type === 'holiday') colors = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                                        if (ev.type === 'exam') colors = 'bg-red-100 text-red-800 border-red-200';
                                        if (ev.type === 'event') colors = 'bg-blue-100 text-blue-800 border-blue-200';

                                        return (
                                            <div key={ev.id} className={`text-xs px-1.5 py-1 rounded border flex justify-between items-center ${colors}`}>
                                                <span className="truncate font-medium">{ev.name}</span>
                                                <button onClick={(e) => handleDeleteEvent(ev.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 rounded">
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Event Modal */}
            <AlertDialog open={showEventModal} onOpenChange={setShowEventModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add Calendar Event on {selectedDateMsg}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Event Name</label>
                            <input type="text" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} placeholder="e.g. Midterm Break" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Type</label>
                            <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20">
                                <option value="holiday">Holiday / Break</option>
                                <option value="exam">Exam Period</option>
                                <option value="event">Special Event</option>
                            </select>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateEvent} className="bg-blue-600 text-white hover:bg-blue-700">Add Event</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
