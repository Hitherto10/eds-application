import React, { useState } from 'react';
import { useTimetable, uid } from '../TimetableContext';
import { saveTimetableDraft } from '../timetableAPIs';
import { Clock, Plus, Trash2, Settings2, Loader2, ArrowRight } from 'lucide-react';

export default function PeriodSetupWizard() {
  const { state, dispatch } = useTimetable();

  // Wizard form state
  const [startTime, setStartTime] = useState('08:00');
  const [periodDuration, setPeriodDuration] = useState(45);
  const [totalPeriods, setTotalPeriods] = useState(8);
  const [saving, setSaving] = useState(false);

  // Breaks configuration
  // E.g. a break after period 2 for 30 minutes, and after period 5 for 45 mins.
  const [breaks, setBreaks] = useState([
    { id: uid(), afterPeriod: 2, durationMinutes: 30, label: 'Short Break' },
    { id: uid(), afterPeriod: 5, durationMinutes: 45, label: 'Lunch Break' }
  ]);

  const addBreak = () => {
    setBreaks([...breaks, { id: uid(), afterPeriod: 1, durationMinutes: 30, label: 'Break' }]);
  };

  const updateBreak = (id, field, value) => {
    setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBreak = (id) => {
    setBreaks(breaks.filter(b => b.id !== id));
  };

  // Time math helper
  const addMinutesToTime = (timeStr, minsToAdd) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins + minsToAdd);
    return date.toTimeString().slice(0, 5); // Returns HH:mm
  };

  const generatePeriods = () => {
    let currentStartTime = startTime;
    const generated = [];
    let periodNumber = 1;

    for (let i = 1; i <= totalPeriods; i++) {
       // Add the teaching period
       const endTime = addMinutesToTime(currentStartTime, periodDuration);
       generated.push({
         id: `p_${uid()}`,
         number: periodNumber,
         label: `Period ${periodNumber}`,
         start: currentStartTime,
         end: endTime,
         isBreak: false
       });
       currentStartTime = endTime;
       periodNumber++;

       // Check if there's a break scheduled after this period
       const scheduledBreaks = breaks.filter(b => b.afterPeriod === i);
       for (const b of scheduledBreaks) {
          const breakEndTime = addMinutesToTime(currentStartTime, b.durationMinutes);
          generated.push({
            id: `b_${uid()}`,
            number: periodNumber - 1, // breaks don't increment the teaching period number count
            label: b.label || 'Break',
            start: currentStartTime,
            end: breakEndTime,
            isBreak: true
          });
          currentStartTime = breakEndTime;
       }
    }

    return generated;
  };

  const handleGenerate = async () => {
    const generatedPeriods = generatePeriods();
    setSaving(true);
    
    try {
      // 1. Dispatch locally so UI switches
      dispatch({ type: 'SET_PERIODS', payload: generatedPeriods });

      // 2. Persist this structure as a new draft
      const payload = {
        classId: state.selectedClass.id,
        termId: state.selectedTerm.id,
        academicYearId: state.selectedYear.id,
        periods: generatedPeriods,
        schedules: [], // brand new draft, no schedules yet
      };
      
      const res = await saveTimetableDraft(payload);
      if (res.success) {
        dispatch({ type: 'SET_SAVED', at: res.data.savedAt, draftId: res.data.draftId });
      }
    } catch (err) {
      console.error('Failed to save generated periods:', err);
      alert('Failed to save periods. Please try again.');
      dispatch({ type: 'SET_PERIODS', payload: [] }); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50/50 p-4 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full p-8 rounded-2xl shadow-sm border border-gray-200">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-100">
             <Settings2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Period Configuration Wizard</h2>
          <p className="text-gray-500 mt-2">
            Let's structure the timetable grid for <span className="font-bold text-gray-700">{state.selectedClass?.name}</span> before adding subjects.
          </p>
        </div>

        <div className="space-y-8">
          {/* General Period Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">School Starts At</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Period Duration</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="5" max="180"
                  value={periodDuration}
                  onChange={e => setPeriodDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-right placeholder:text-left pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">MINS</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Periods</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="1" max="25"
                  value={totalPeriods}
                  onChange={e => setTotalPeriods(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-right pr-16"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">PERIODS</span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Breaks Configuration */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Breaks & Lunches</label>
              <button 
                onClick={addBreak}
                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Add Break
              </button>
            </div>

            {breaks.length === 0 ? (
               <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-lg text-center text-sm text-gray-500">
                 No breaks configured. The periods will run back-to-back.
               </div>
            ) : (
              <div className="space-y-3">
                {breaks.map((b) => (
                   <div key={b.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                     <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Break occurs after</span>
                     
                     <select 
                       value={b.afterPeriod}
                       onChange={e => updateBreak(b.id, 'afterPeriod', Number(e.target.value))}
                       className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                     >
                       {Array.from({length: totalPeriods}).map((_, i) => (
                         <option key={i+1} value={i+1}>Period {i+1}</option>
                       ))}
                     </select>
                     
                     <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">for</span>
                     
                     <div className="relative">
                       <input 
                         type="number" 
                         value={b.durationMinutes}
                         onChange={e => updateBreak(b.id, 'durationMinutes', Number(e.target.value))}
                         className="bg-white border border-gray-300 rounded pl-2 pr-10 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-24 text-right"
                       />
                       <span className="absolute right-2 top-1.5 text-[10px] font-bold text-gray-400">MINS</span>
                     </div>
                     
                     <span className="text-sm font-semibold text-gray-600 whitespace-nowrap flex-1 text-right">Label:</span>
                     
                     <input 
                         type="text" 
                         value={b.label}
                         onChange={e => updateBreak(b.id, 'label', e.target.value)}
                         className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-32"
                      />

                     <button onClick={() => removeBreak(b.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors ml-auto">
                        <Trash2 size={16} />
                     </button>
                   </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Action */}
          <button 
            onClick={handleGenerate}
            disabled={saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl outline-none focus:ring-4 focus:ring-blue-500/30 transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-wait"
          >
            {saving ? (
               <><Loader2 className="w-5 h-5 animate-spin" /> Generating Grid...</>
            ) : (
               <>Generate Working Grid <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
