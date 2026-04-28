import React, { useState, useEffect } from 'react';
import { useTimetable } from './TimetableContext';
import { Calendar, Plus, ChevronLeft, ChevronRight, Save, Trash2 } from 'lucide-react';
import { createAcademicYear, createTerm, createHoliday, deleteHoliday } from './timetableAPIs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';

export default function AcademicCalendarBuilder() {
  const { state, dispatch } = useTimetable();

  // Selected view month
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals
  const [showYearModal, setShowYearModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedDateMsg, setSelectedDateMsg] = useState(null);

  // Month navigation
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Generated calendar grid
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  // Forms
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });
  const [termForm, setTermForm] = useState({ name: '', startDate: '', endDate: '' });
  const [holidayForm, setHolidayForm] = useState({ name: '', type: 'holiday' }); // date injected on save

  const handleCreateYear = async () => {
    const res = await createAcademicYear(yearForm);
    if (res.success) {
      dispatch({ type: 'ADD_ACADEMIC_YEAR', payload: res.data.academicYear });
      dispatch({ type: 'SELECT_YEAR', payload: res.data.academicYear });
      setShowYearModal(false);
    }
  };

  const handleCreateTerm = async () => {
    if (!state.selectedYear) return;
    const payload = { ...termForm, academicYearId: state.selectedYear.id };
    const res = await createTerm(payload);
    if (res.success) {
      dispatch({ type: 'ADD_TERM', payload: res.data.term });
      dispatch({ type: 'SELECT_TERM', payload: res.data.term });
      setShowTermModal(false);
    }
  };

  const handleDateClick = (dateObj) => {
    if (!state.selectedTerm) return alert('Select a term first before adding events.');
    const dateStr = dateObj.toISOString().split('T')[0];
    setSelectedDateMsg(dateStr);
    setShowHolidayModal(true);
  };

  const handleCreateHoliday = async () => {
    const payload = { 
      termId: state.selectedTerm.id,
      name: holidayForm.name,
      type: holidayForm.type,
      date: selectedDateMsg 
    };
    const res = await createHoliday(payload);
    if (res.success) {
      dispatch({ type: 'ADD_HOLIDAY', payload: res.data.holiday });
      setShowHolidayModal(false);
      setHolidayForm({ name: '', type: 'holiday' });
    }
  };

  const handleDeleteHoliday = async (id, e) => {
    e.stopPropagation();
    if(confirm('Delete this event?')) {
      const res = await deleteHoliday(id);
      if(res.success) dispatch({ type: 'REMOVE_HOLIDAY', id });
    }
  };

  // Helper to get events for a cell
  const getEventsForDate = (dateObj) => {
    if (!dateObj) return [];
    const dStr = dateObj.toISOString().split('T')[0];
    return state.holidays.filter(h => h.date === dStr);
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 max-w-6xl mx-auto w-full">
      
      {/* Top Config Ribbon */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
        
        {/* Years */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Academic Year</label>
          <div className="flex items-center gap-2">
            <select
              value={state.selectedYear?.id || ''}
              onChange={e => {
                const y = state.academicYears.find(x => x.id === e.target.value);
                dispatch({ type: 'SELECT_YEAR', payload: y });
              }}
              className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Select Year --</option>
              {state.academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <button onClick={() => setShowYearModal(true)} className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600"><Plus size={16} /></button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Term</label>
          <div className="flex items-center gap-2">
            <select
              value={state.selectedTerm?.id || ''}
              onChange={e => {
                const t = state.terms.find(x => x.id === e.target.value);
                dispatch({ type: 'SELECT_TERM', payload: t });
              }}
              disabled={!state.selectedYear}
              className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
              <option value="">-- Select Term --</option>
              {state.terms.filter(t => t.academicYearId === state.selectedYear?.id).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button disabled={!state.selectedYear} onClick={() => setShowTermModal(true)} className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"><Plus size={16} /></button>
          </div>
        </div>

      </div>

      {/* Calendar View */}
      <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-col flex-1">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-100"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold rounded bg-white border border-gray-200 hover:bg-gray-100">Today</button>
            <button onClick={nextMonth} className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-100"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
             <div key={d} className="p-3 text-center text-sm font-bold text-gray-500 uppercase">{d}</div>
           ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((dateObj, idx) => {
            if (!dateObj) return <div key={idx} className="border-r border-b border-gray-100 bg-gray-50/50 min-h-[100px]" />;
            
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
                        <button onClick={(e) => handleDeleteHoliday(ev.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 rounded">
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

      {/* --- Modals --- */}
      
      {/* Create Year Modal */}
      <AlertDialog open={showYearModal} onOpenChange={setShowYearModal}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Create Academic Year</AlertDialogTitle></AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name (e.g. 2025/2026)</label>
              <input type="text" value={yearForm.name} onChange={e => setYearForm({...yearForm, name: e.target.value})} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input type="date" value={yearForm.startDate} onChange={e => setYearForm({...yearForm, startDate: e.target.value})} className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input type="date" value={yearForm.endDate} onChange={e => setYearForm({...yearForm, endDate: e.target.value})} className="w-full mt-1 p-2 border rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateYear} className="bg-blue-600">Create</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Term Modal */}
      <AlertDialog open={showTermModal} onOpenChange={setShowTermModal}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Create Term</AlertDialogTitle></AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name (e.g. First Term)</label>
              <input type="text" value={termForm.name} onChange={e => setTermForm({...termForm, name: e.target.value})} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input type="date" value={termForm.startDate} onChange={e => setTermForm({...termForm, startDate: e.target.value})} className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input type="date" value={termForm.endDate} onChange={e => setTermForm({...termForm, endDate: e.target.value})} className="w-full mt-1 p-2 border rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateTerm} className="bg-blue-600">Create</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Event Modal */}
      <AlertDialog open={showHolidayModal} onOpenChange={setShowHolidayModal}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Add Calendar Event on {selectedDateMsg}</AlertDialogTitle></AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Event Name</label>
              <input type="text" value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})} placeholder="e.g. Midterm Break" className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={holidayForm.type} onChange={e => setHolidayForm({...holidayForm, type: e.target.value})} className="w-full mt-1 p-2 border rounded">
                <option value="holiday">Holiday / Break</option>
                <option value="exam">Exam Period</option>
                <option value="event">Special Event</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateHoliday} className="bg-blue-600">Add</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
