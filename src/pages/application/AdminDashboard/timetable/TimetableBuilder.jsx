import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import { useTimetable, uid } from './TimetableContext';
import { getTimetableDraft, saveTimetableDraft } from './timetableAPIs';

// Components
import PalettePanel from './components/PalettePanel';
import WeeklyGrid from './components/WeeklyGrid';
import PropertiesPanel from './components/PropertiesPanel';
import PeriodBlock from './components/PeriodBlock';
import PeriodSetupWizard from './components/PeriodSetupWizard';

/**
 * TimetableBuilder
 * ─────────────────────────────────────────────────────────────────────────────
 * The core 3-panel builder layout.
 * Manages DndContext, drag overlay, and auto-saving drafts.
 */
export default function TimetableBuilder() {
  const { state, dispatch } = useTimetable();
  const [activeDragData, setActiveDragData] = useState(null);

  // Auto-save debouncer
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    // We only auto-save if we have a valid selection and it's a draft
    if (!state.selectedClass || !state.selectedTerm || state.isPublished) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Set "saving..." indicator
    saveTimeoutRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SAVING', value: true });
      try {
        const payload = {
          classId: state.selectedClass.id,
          termId: state.selectedTerm.id,
          academicYearId: state.selectedYear.id,
          schedules: state.schedules,
        };
        const res = await saveTimetableDraft(payload);
        if (res.success) {
          dispatch({ type: 'SET_SAVED', at: res.data.savedAt, draftId: res.data.draftId });
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 4000); // 4 seconds debounced

    return () => clearTimeout(saveTimeoutRef.current);
  }, [state.schedules, state.selectedClass, state.selectedTerm, state.isPublished, dispatch]);

  // Handle DND Handlers
  const handleDragStart = (e) => {
    setActiveDragData(e.active.data.current);
  };

  const handleDragEnd = (e) => {
    setActiveDragData(null);
    const { active, over } = e;
    
    if (!over) return; // Dropped outside valid area

    const sourceData = active.data.current;
    const dropData = over.data.current; // always a CELL in this setup

    if (!dropData || dropData.type !== 'CELL') return;

    if (sourceData.type === 'SUBJECT') {
      // Create new entry
      const subject = sourceData.payload;
      const newEntry = {
        id: uid(),
        classId: state.selectedClass.id,
        className: state.selectedClass.name,
        dayOfWeek: dropData.day,
        periodId: dropData.periodId,
        periodNumber: dropData.periodNumber,
        startTime: dropData.startTime,
        endTime: dropData.endTime,
        subjectId: subject.id,
        subjectName: subject.name,
        teacherId: null,
        teacherName: null,
        roomId: null,
        roomName: null,
      };
      
      dispatch({ type: 'ADD_SCHEDULE_ENTRY', payload: newEntry });
      // Auto-select newly dropped item
      dispatch({ type: 'SELECT_ENTRY', id: newEntry.id });
    } 
    else if (sourceData.type === 'TEACHER') {
      // Applied directly to a cell? If cell has exactly 1 entry, update it.
      // If none or multiple, we ignore (must drop on right panel or single block)
      const teacher = sourceData.payload;
      const cellId = `${dropData.day}__${dropData.periodId}`;
      const cellEntries = state.schedules.filter(s => s.dayOfWeek === dropData.day && s.periodId === dropData.periodId);
      
      if (cellEntries.length === 1) {
        dispatch({ type: 'UPDATE_SCHEDULE_ENTRY', payload: { id: cellEntries[0].id, teacherId: teacher.id, teacherName: teacher.name } });
      }
    }
    else if (sourceData.type === 'ROOM') {
      const room = sourceData.payload;
      const cellId = `${dropData.day}__${dropData.periodId}`;
      const cellEntries = state.schedules.filter(s => s.dayOfWeek === dropData.day && s.periodId === dropData.periodId);
      if (cellEntries.length === 1) {
        dispatch({ type: 'UPDATE_SCHEDULE_ENTRY', payload: { id: cellEntries[0].id, roomId: room.name, roomName: room.name } });
      }
    }
    else if (sourceData.type === 'PLACED_BLOCK') {
      // Move existing block
      dispatch({ 
        type: 'MOVE_SCHEDULE_ENTRY', 
        id: sourceData.entry.id, 
        day: dropData.day, 
        periodId: dropData.periodId,
        periodNumber: dropData.periodNumber,
        startTime: dropData.startTime,
        endTime: dropData.endTime
      });
    }
  };

  const handleDragCancel = () => setActiveDragData(null);

  return (
    <DndContext 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd} 
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <div className="flex h-full w-full bg-slate-100/50 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        {state.periods.length === 0 && state.selectedClass && state.selectedTerm ? (
           <PeriodSetupWizard />
        ) : (
          <>
            <PalettePanel />
            <WeeklyGrid activeDragData={activeDragData} />
            <PropertiesPanel />
          </>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragData?.type === 'SUBJECT' ? (
          <div className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded shadow-2xl opacity-90 scale-105 pointer-events-none">
            {activeDragData.payload.name}
          </div>
        ) : activeDragData?.type === 'TEACHER' ? (
           <div className="px-3 py-1.5 bg-gray-800 text-white font-bold text-xs rounded shadow-2xl opacity-90 scale-105 pointer-events-none">
             Assign: {activeDragData.payload.name}
           </div>
        ) : activeDragData?.type === 'ROOM' ? (
          <div className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded shadow-2xl opacity-90 scale-105 pointer-events-none">
             Room: {activeDragData.payload.name}
           </div>
        ) : activeDragData?.type === 'PLACED_BLOCK' ? (
          <div className="w-[120px] pointer-events-none opacity-80 scale-105 shadow-2xl">
            <PeriodBlock 
              entry={activeDragData.entry} 
              isSelected 
              readOnly 
              onSelect={()=>{}} 
              onRemove={()=>{}} 
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
