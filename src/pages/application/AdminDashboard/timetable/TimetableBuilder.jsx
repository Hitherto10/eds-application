import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import { useTimetable, uid } from './TimetableContext';
import { saveTimetableDraft } from './timetableAPIs';

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
 *
 * RENDERING DECISION:
 *   - periods.length === 0  → Always show PeriodSetupWizard.
 *     The wizard itself handles the "no class/term selected" state gracefully.
 *   - periods.length  >  0  → Show the full 3-panel timetable grid.
 *
 * NOTE: The previous condition also required `state.selectedClass &&
 * state.selectedTerm` before showing the wizard. This was wrong — it caused
 * the grid (with its "No class selected" placeholder) to render as the first
 * screen the user sees, completely bypassing the wizard. The guard now lives
 * inside PeriodSetupWizard where it belongs (disabling the Generate button).
 */
export default function TimetableBuilder() {
  const { state, dispatch } = useTimetable();
  const [activeDragData, setActiveDragData] = useState(null);

  // Auto-save debouncer
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    // Only auto-save when we have a valid selection and we are in draft mode
    if (!state.selectedClass || !state.selectedTerm || state.isPublished) return;
    // Nothing to save yet if the grid hasn't been configured
    if (state.periods.length === 0) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

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
    }, 4000); // 4-second debounce

    return () => clearTimeout(saveTimeoutRef.current);
  }, [state.schedules, state.selectedClass, state.selectedTerm, state.isPublished, dispatch]);

  // ── DnD handlers ────────────────────────────────────────────────────────────

  const handleDragStart = (e) => {
    setActiveDragData(e.active.data.current);
  };

  const handleDragEnd = (e) => {
    setActiveDragData(null);
    const { active, over } = e;

    if (!over) return;

    const sourceData = active.data.current;
    const dropData = over.data.current;

    if (!dropData || dropData.type !== 'CELL') return;

    if (sourceData.type === 'SUBJECT') {
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
      dispatch({ type: 'SELECT_ENTRY', id: newEntry.id });
    } else if (sourceData.type === 'TEACHER') {
      const teacher = sourceData.payload;
      const cellEntries = state.schedules.filter(
          s => s.dayOfWeek === dropData.day && s.periodId === dropData.periodId
      );
      if (cellEntries.length === 1) {
        dispatch({
          type: 'UPDATE_SCHEDULE_ENTRY',
          payload: { id: cellEntries[0].id, teacherId: teacher.id, teacherName: teacher.name },
        });
      }
    } else if (sourceData.type === 'ROOM') {
      const room = sourceData.payload;
      const cellEntries = state.schedules.filter(
          s => s.dayOfWeek === dropData.day && s.periodId === dropData.periodId
      );
      if (cellEntries.length === 1) {
        dispatch({
          type: 'UPDATE_SCHEDULE_ENTRY',
          payload: { id: cellEntries[0].id, roomId: room.name, roomName: room.name },
        });
      }
    } else if (sourceData.type === 'PLACED_BLOCK') {
      dispatch({
        type: 'MOVE_SCHEDULE_ENTRY',
        id: sourceData.entry.id,
        day: dropData.day,
        periodId: dropData.periodId,
        periodNumber: dropData.periodNumber,
        startTime: dropData.startTime,
        endTime: dropData.endTime,
      });
    }
  };

  const handleDragCancel = () => setActiveDragData(null);

  // ── Rendering decision ───────────────────────────────────────────────────────
  //
  // Show the Period Setup Wizard whenever no periods are configured.
  // This is the correct entry point for the builder — it is always the first
  // thing the user sees. The wizard itself disables "Generate" until a class
  // and term are selected, so no unsafe API calls are made prematurely.
  //
  // Previously the condition was:
  //   state.periods.length === 0 && state.selectedClass && state.selectedTerm
  // That made the wizard unreachable on first load (selectedClass is null),
  // causing the grid's "No class selected" placeholder to appear instead.

  const showWizard = state.periods.length === 0;

  return (
      <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          collisionDetection={pointerWithin}
      >
        <div className="flex h-full w-full bg-slate-100/50 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          {showWizard ? (
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
                    onSelect={() => {}}
                    onRemove={() => {}}
                />
              </div>
          ) : null}
        </DragOverlay>
      </DndContext>
  );
}