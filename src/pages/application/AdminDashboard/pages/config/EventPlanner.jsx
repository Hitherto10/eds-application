import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../timetable/TimetableContext';
import { Trash2, AlertCircle, ChevronLeft, ChevronRight, Bell, Mail, MessageSquare, Calendar as CalendarIcon, Clock, Users, X, Check, Edit2, Eye } from 'lucide-react';
import { getAcademicProfile, createEvent, updateEvent, deleteEvent, getEventNotificationsConfig } from '../../timetable/timetableAPIs';
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
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [editingEventId, setEditingEventId] = useState(null);

    const [eventForm, setEventForm] = useState({
        name: '',
        type: 'holiday',
        notificationsEnabled: false,
        notificationTargets: { roles: [], classIds: [], userIds: [] },
        notificationChannels: [],
        notificationSchedule: { type: 'immediate', sendAt: '', reminderEnabled: false }
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCalendarTermId, setSelectedCalendarTermId] = useState(null);

    // Notification UI State
    const [targetTab, setTargetTab] = useState('roles'); // 'roles', 'classes', 'individuals'
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Data for Targets
    const MOCK_CLASSES = [
        { id: 'c1', name: 'Year 5' },
        { id: 'c2', name: 'Year 6' },
        { id: 'c3', name: 'Science 101' },
        { id: 'c4', name: 'Math 202' }
    ];

    const MOCK_USERS = [
        { id: 'u1', name: 'Alice Smith', email: 'alice@example.com' },
        { id: 'u2', name: 'Bob Jones', email: 'bob@example.com' },
        { id: 'u3', name: 'Charlie Brown', email: 'charlie@example.com' }
    ];

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
                    currentYear: res.data.currentAcademicYear || null,
                    currentTerm: res.data.currentTerm || null,
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
        setModalMode('create');
        setEditingEventId(null);
        setEventForm({
            name: '',
            type: 'holiday',
            notificationsEnabled: false,
            notificationTargets: { roles: [], classIds: [], userIds: [] },
            notificationChannels: [],
            notificationSchedule: { type: 'immediate', sendAt: '', reminderEnabled: false }
        });
        setShowEventModal(true);
    };

    const fetchEventDataForModal = async (eventObj, mode) => {
        setSelectedDateMsg(eventObj.date);
        setModalMode(mode);
        setEditingEventId(eventObj.id);
        
        let notifState = {
            notificationsEnabled: false,
            notificationTargets: { roles: [], classIds: [], userIds: [] },
            notificationChannels: [],
            notificationSchedule: { type: 'immediate', sendAt: '', reminderEnabled: false }
        };

        if (eventObj.notificationConfigId) {
            const configRes = await getEventNotificationsConfig(eventObj.id);
            if (configRes.success && configRes.data) {
                notifState = {
                    notificationsEnabled: true,
                    notificationTargets: { roles: [], classIds: [], userIds: [], ...(configRes.data.targets || {}) },
                    notificationChannels: configRes.data.channels || [],
                    notificationSchedule: configRes.data.schedule || { type: 'immediate', sendAt: '', reminderEnabled: false }
                };
            }
        }

        setEventForm({
            name: eventObj.name,
            type: eventObj.type,
            ...notifState
        });
        setShowEventModal(true);
    };

    const handleEditEvent = (eventObj, e) => {
        e.stopPropagation();
        const dateStr = eventObj.date;
        const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);
        if (isPast) return;
        fetchEventDataForModal(eventObj, 'edit');
    };

    const handleViewEvent = (eventObj) => {
        fetchEventDataForModal(eventObj, 'view');
    };

    const handleSaveEvent = async () => {
        // Validation for notifications
        if (eventForm.notificationsEnabled) {
            const hasTargets = eventForm.notificationTargets.roles.length > 0 || eventForm.notificationTargets.classIds.length > 0 || eventForm.notificationTargets.userIds.length > 0;
            if (!hasTargets) return alert("Please select at least one target audience.");
            if (eventForm.notificationChannels.length === 0) return alert("Please select at least one notification channel (Email or SMS).");
        }

        const payload = {
            termId: selectedCalendarTermId,
            name: eventForm.name,
            type: eventForm.type,
            date: selectedDateMsg,
            notifications: {
                enabled: eventForm.notificationsEnabled,
                targets: eventForm.notificationTargets,
                channels: eventForm.notificationChannels,
                schedule: eventForm.notificationSchedule
            }
        };

        if (modalMode === 'edit') {
            const res = await updateEvent(editingEventId, payload);
            if (res.success) {
                dispatch({ type: 'REMOVE_EVENT', id: editingEventId });
                dispatch({ type: 'ADD_EVENT', payload: res.data.event });
                setShowEventModal(false);
            }
        } else {
            const res = await createEvent(payload);
            if (res.success) {
                dispatch({ type: 'ADD_EVENT', payload: res.data.event });
                setShowEventModal(false);
            }
        }
    };

    // Notification Handlers
    const toggleRole = (role) => {
        setEventForm(prev => {
            const roles = prev.notificationTargets.roles.includes(role)
                ? prev.notificationTargets.roles.filter(r => r !== role)
                : [...prev.notificationTargets.roles, role];
            return { ...prev, notificationTargets: { ...prev.notificationTargets, roles } };
        });
    };

    const toggleClass = (classId) => {
        setEventForm(prev => {
            const classIds = prev.notificationTargets.classIds.includes(classId)
                ? prev.notificationTargets.classIds.filter(id => id !== classId)
                : [...prev.notificationTargets.classIds, classId];
            return { ...prev, notificationTargets: { ...prev.notificationTargets, classIds } };
        });
    };

    const toggleUser = (userId) => {
        setEventForm(prev => {
            const userIds = prev.notificationTargets.userIds.includes(userId)
                ? prev.notificationTargets.userIds.filter(id => id !== userId)
                : [...prev.notificationTargets.userIds, userId];
            return { ...prev, notificationTargets: { ...prev.notificationTargets, userIds } };
        });
    };

    const removePill = (type, value) => {
        setEventForm(prev => {
            const newTargets = { ...prev.notificationTargets };
            if (type === 'role') newTargets.roles = newTargets.roles.filter(r => r !== value);
            if (type === 'class') newTargets.classIds = newTargets.classIds.filter(id => id !== value);
            if (type === 'user') newTargets.userIds = newTargets.userIds.filter(id => id !== value);
            return { ...prev, notificationTargets: newTargets };
        });
    };

    const toggleChannel = (channel) => {
        setEventForm(prev => {
            const channels = prev.notificationChannels.includes(channel)
                ? prev.notificationChannels.filter(c => c !== channel)
                : [...prev.notificationChannels, channel];
            return { ...prev, notificationChannels: channels };
        });
    };

    const handleDeleteEvent = async (id, e) => {
        e.stopPropagation();
        if (confirm('Delete this event?')) {
            const res = await deleteEvent(id);
            if (res.success) dispatch({ type: 'REMOVE_EVENT', id });
        }
    };

    const getEventsForDate = (dateObj) => {
        if (!dateObj) return [];
        const dStr = dateObj.toISOString().split('T')[0];
        return state.events.filter(h => h.date === dStr && h.termId === selectedCalendarTermId);
    };


    return (
        <div className="flex flex-col gap-8 bg-gray-50/50  w-full ">
            {/* Header & System Summary */}
            <div className="flex flex-col p-2 md:p-4 lg:p-0 md:flex-row justify-between items-start md:items-center gap-4">
                <div className={``}>
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
                            <span className="text-sm font-medium text-amber-600 flex items-center gap-1"><AlertCircle size={14} /> Not Set</span>
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
                            <span className="text-sm font-medium text-amber-600 flex items-center gap-1"><AlertCircle size={14} /> Not Set</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Events Calendar Section */}
            <div className="bg-white  mx-auto col-span-2 rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col w-full mt-2">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50 flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Events Calendar - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-4 flex-wrap">
                        <select
                            value={selectedCalendarTermId || ''}
                            onChange={e => {
                                setSelectedCalendarTermId(e.target.value);
                                dispatch({ type: 'SET_ACTIVE_TERM', payload: state.terms.find(t => t.id === e.target.value) });
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

                                        const isPastEvent = new Date(ev.date) < new Date(new Date().toISOString().split('T')[0]);

                                        return (
                                            <div key={ev.id} onClick={() => handleViewEvent(ev)} className={`text-xs px-1.5 py-1 rounded border flex justify-between items-center cursor-pointer ${colors}`}>
                                                <span className="truncate font-medium">{ev.name}</span>
                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                                    <button onClick={(e) => handleEditEvent(ev, e)} disabled={isPastEvent} className={`p-0.5 rounded ${isPastEvent ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-black/10'}`}>
                                                        <Edit2 size={10} />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteEvent(ev.id, e)} className="p-0.5 hover:bg-black/10 rounded">
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
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
                <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">
                            {modalMode === 'create' ? 'Add' : modalMode === 'edit' ? 'Edit' : 'View'} Calendar Event on {selectedDateMsg}
                        </AlertDialogTitle>
                    </AlertDialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Core Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Event Name</label>
                                <input disabled={modalMode === 'view'} type="text" value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} placeholder="e.g. Midterm Break" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Type</label>
                                <select disabled={modalMode === 'view'} value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500">
                                    <option value="holiday">Holiday / Break</option>
                                    <option value="exam">Exam Period</option>
                                    <option value="event">Special Event</option>
                                </select>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Notifications Section Container */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Bell size={16} className="text-blue-600" /> Event Notifications</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Alert students, parents, or staff about this event.</p>
                                </div>
                                <label className={`relative inline-flex items-center ${modalMode === 'view' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={eventForm.notificationsEnabled}
                                        disabled={modalMode === 'view'}
                                        onChange={e => setEventForm({ ...eventForm, notificationsEnabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {eventForm.notificationsEnabled && (
                                <div className="space-y-6 bg-white p-4 rounded-lg border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">

                                    {/* Target Selector */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Users size={14} /> Target Audience</h4>
                                        <div className="space-y-4 border border-gray-200 rounded-lg p-3 bg-gray-50/50">

                                            {/* Tabs */}
                                            <div className="flex border-b border-gray-200">
                                                {['roles', 'classes', 'individuals'].map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => { setTargetTab(tab); setSearchQuery(''); }}
                                                        className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${targetTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Tab Content */}
                                            <div className="min-h-[100px]">
                                                {targetTab === 'roles' && (
                                                    <div className="flex flex-wrap gap-2 animate-in fade-in">
                                                        {['All Parents', 'All Teachers', 'All Admins'].map(role => {
                                                            const roleVal = role.toLowerCase().replace('all ', '');
                                                            const isSelected = eventForm.notificationTargets.roles.includes(roleVal);
                                                            return (
                                                                <button
                                                                    key={role}
                                                                    disabled={modalMode === 'view'}
                                                                    onClick={() => toggleRole(roleVal)}
                                                                    className={`px-3 py-1.5 text-sm rounded-full border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600'} ${modalMode !== 'view' && !isSelected ? 'hover:bg-gray-50' : ''} ${modalMode === 'view' ? 'cursor-default opacity-90' : ''}`}
                                                                >
                                                                    {isSelected && <Check size={14} />} {role}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                {targetTab === 'classes' && (
                                                    <div className="space-y-3 animate-in fade-in">
                                                        <input
                                                            type="text"
                                                            placeholder="Search classes (e.g. Year 5)..."
                                                            value={searchQuery}
                                                            disabled={modalMode === 'view'}
                                                            onChange={e => setSearchQuery(e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
                                                        />
                                                        <div className="max-h-[120px] overflow-y-auto space-y-1">
                                                            {MOCK_CLASSES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cls => (
                                                                <div
                                                                    key={cls.id}
                                                                    onClick={() => modalMode !== 'view' && toggleClass(cls.id)}
                                                                    className={`p-2 rounded text-sm flex items-center justify-between ${eventForm.notificationTargets.classIds.includes(cls.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${modalMode !== 'view' ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
                                                                >
                                                                    <span>{cls.name}</span>
                                                                    {eventForm.notificationTargets.classIds.includes(cls.id) && <Check size={14} />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {targetTab === 'individuals' && (
                                                    <div className="space-y-3 animate-in fade-in">
                                                        <input
                                                            type="text"
                                                            placeholder="Search name or email..."
                                                            value={searchQuery}
                                                            disabled={modalMode === 'view'}
                                                            onChange={e => setSearchQuery(e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
                                                        />
                                                        <div className="max-h-[120px] overflow-y-auto space-y-1">
                                                            {MOCK_USERS.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                                                                <div
                                                                    key={user.id}
                                                                    onClick={() => modalMode !== 'view' && toggleUser(user.id)}
                                                                    className={`p-2 rounded text-sm flex items-center justify-between ${eventForm.notificationTargets.userIds.includes(user.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${modalMode !== 'view' ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
                                                                >
                                                                    <div>
                                                                        <span className="block">{user.name}</span>
                                                                        <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                                                                    </div>
                                                                    {eventForm.notificationTargets.userIds.includes(user.id) && <Check size={14} />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected Pills */}
                                            {(eventForm.notificationTargets.roles.length > 0 || eventForm.notificationTargets.classIds.length > 0 || eventForm.notificationTargets.userIds.length > 0) && (
                                                <div className="pt-3 border-t border-gray-200">
                                                    <div className="flex flex-wrap gap-2">
                                                        {eventForm.notificationTargets.roles.map(r => (
                                                            <span key={`r_${r}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                                                                Role: {r.charAt(0).toUpperCase() + r.slice(1)}
                                                                {modalMode !== 'view' && <button onClick={() => removePill('role', r)} className="hover:text-blue-900"><X size={12} /></button>}
                                                            </span>
                                                        ))}
                                                        {eventForm.notificationTargets.classIds.map(id => {
                                                            const cls = MOCK_CLASSES.find(c => c.id === id);
                                                            return cls ? (
                                                                <span key={`c_${id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                                                                    Class: {cls.name}
                                                                    {modalMode !== 'view' && <button onClick={() => removePill('class', id)} className="hover:text-emerald-900"><X size={12} /></button>}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                        {eventForm.notificationTargets.userIds.map(id => {
                                                            const u = MOCK_USERS.find(user => user.id === id);
                                                            return u ? (
                                                                <span key={`u_${id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-100 text-purple-800 text-xs font-semibold">
                                                                    User: {u.name}
                                                                    {modalMode !== 'view' && <button onClick={() => removePill('user', id)} className="hover:text-purple-900"><X size={12} /></button>}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dummy Audience Estimator */}
                                            {(eventForm.notificationTargets.roles.length > 0 || eventForm.notificationTargets.classIds.length > 0) && (
                                                <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-2 rounded border border-emerald-100 flex items-center gap-2 mt-2">
                                                    <AlertCircle size={14} /> This will notify approximately {(eventForm.notificationTargets.roles.length * 150) + (eventForm.notificationTargets.classIds.length * 30) + eventForm.notificationTargets.userIds.length} users.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Channel Selection */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><MessageSquare size={14} /> Delivery Channels</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => modalMode !== 'view' && toggleChannel('email')}
                                                className={`p-3 rounded-lg border transition-all ${eventForm.notificationChannels.includes('email') ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200'} ${modalMode !== 'view' ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-90'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Mail size={16} className={eventForm.notificationChannels.includes('email') ? 'text-blue-600' : 'text-gray-500'} />
                                                    <span className="font-semibold text-sm">Email</span>
                                                </div>
                                                <p className="text-xs text-gray-500">Best for detailed information.</p>
                                            </div>
                                            <div
                                                onClick={() => modalMode !== 'view' && toggleChannel('sms')}
                                                className={`p-3 rounded-lg border transition-all ${eventForm.notificationChannels.includes('sms') ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200'} ${modalMode !== 'view' ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-90'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare size={16} className={eventForm.notificationChannels.includes('sms') ? 'text-blue-600' : 'text-gray-500'} />
                                                    <span className="font-semibold text-sm">SMS</span>
                                                </div>
                                                <p className="text-xs text-gray-500">Best for urgent alerts. Limit 160 chars.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schedule Controls */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Clock size={14} /> Scheduling</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <label className={`flex items-center gap-2 text-sm ${modalMode === 'view' ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
                                                    <input
                                                        type="radio"
                                                        name="scheduleType"
                                                        disabled={modalMode === 'view'}
                                                        checked={eventForm.notificationSchedule.type === 'immediate'}
                                                        onChange={() => setEventForm(prev => ({ ...prev, notificationSchedule: { ...prev.notificationSchedule, type: 'immediate' } }))}
                                                        className="text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:bg-gray-100"
                                                    />
                                                    Send immediately
                                                </label>
                                                <label className={`flex items-center gap-2 text-sm ${modalMode === 'view' ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
                                                    <input
                                                        type="radio"
                                                        name="scheduleType"
                                                        disabled={modalMode === 'view'}
                                                        checked={eventForm.notificationSchedule.type === 'scheduled'}
                                                        onChange={() => setEventForm(prev => ({ ...prev, notificationSchedule: { ...prev.notificationSchedule, type: 'scheduled' } }))}
                                                        className="text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:bg-gray-100"
                                                    />
                                                    Schedule for later
                                                </label>
                                            </div>

                                            {eventForm.notificationSchedule.type === 'scheduled' && (
                                                <div className="pl-6 animate-in fade-in slide-in-from-top-1">
                                                    <input
                                                        type="datetime-local"
                                                        disabled={modalMode === 'view'}
                                                        value={eventForm.notificationSchedule.sendAt}
                                                        onChange={e => setEventForm(prev => ({ ...prev, notificationSchedule: { ...prev.notificationSchedule, sendAt: e.target.value } }))}
                                                        className="p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
                                                    />
                                                </div>
                                            )}

                                            <label className={`flex items-center gap-2 text-sm mt-2 bg-gray-50 p-2 rounded border border-gray-100 ${modalMode === 'view' ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={modalMode === 'view'}
                                                    checked={eventForm.notificationSchedule.reminderEnabled}
                                                    onChange={e => setEventForm(prev => ({ ...prev, notificationSchedule: { ...prev.notificationSchedule, reminderEnabled: e.target.checked } }))}
                                                    className="text-blue-600 rounded focus:ring-blue-500 w-4 h-4 border-gray-300 disabled:bg-gray-100"
                                                />
                                                Send an automated reminder 24h before
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter className="border-t border-gray-100 pt-4 mt-2">
                        {modalMode === 'view' ? (
                            <AlertDialogCancel onClick={() => setShowEventModal(false)}>Close</AlertDialogCancel>
                        ) : (
                            <>
                                <AlertDialogCancel onClick={() => setShowEventModal(false)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSaveEvent} className="bg-blue-600 text-white hover:bg-blue-700">
                                    {eventForm.notificationsEnabled ? 'Save & Notify' : 'Save Event'}
                                </AlertDialogAction>
                            </>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
