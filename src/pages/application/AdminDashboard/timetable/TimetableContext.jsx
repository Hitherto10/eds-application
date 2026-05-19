import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import { detectConflicts, getConflictedEntryIds, getWarnedEntryIds, hasBlockingConflicts } from './conflictEngine';

// Periods are now dynamic and configured per draft.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// ─── Subject color palette ──
const COLOR_PALETTE = [
  { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500',    dragBg: 'bg-blue-200' },
  { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300',  dot: 'bg-violet-500',  dragBg: 'bg-violet-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500', dragBg: 'bg-emerald-200' },
  { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300',  dot: 'bg-orange-500',  dragBg: 'bg-orange-200' },
  { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-300',    dot: 'bg-pink-500',    dragBg: 'bg-pink-200' },
  { bg: 'bg-cyan-100',    text: 'text-cyan-800',    border: 'border-cyan-300',    dot: 'bg-cyan-500',    dragBg: 'bg-cyan-200' },
  { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-500',   dragBg: 'bg-amber-200' },
  { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300',    dot: 'bg-rose-500',    dragBg: 'bg-rose-200' },
  { bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-300',    dot: 'bg-teal-500',    dragBg: 'bg-teal-200' },
  { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300',  dot: 'bg-indigo-500',  dragBg: 'bg-indigo-200' },
];

/**
 * Returns a stable color scheme for a given subject name/id.
 * Hash is based on character codes — same subject always gets the same color.
 */
export function getSubjectColor(subjectId) {
  if (!subjectId) return COLOR_PALETTE[0];
  const hash = String(subjectId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

/** Lightweight unique ID with no external dependency. */
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

// ─── State ──
const initialState = {
  // Academic context — populated by useGlobalTimetableData on mount
  academicYears: [],
  selectedYear: null,
  terms: [],
  selectedTerm: null,
  events: [],

  // Available resources
  classes: [],           // [{ id, name, level }] — base class levels from API
  arms: [],              // [{ id, classId, name, subjects:[] }] — per-class sections
  armSubjects: {},       // { [armId]: subject[] } — quick-access map for arm subjects
  teachers: [],          // [{ id, name, subjects }]
  subjects: [],          // Shared school-wide subjects
  rooms: ['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Library', 'Gym'],

  // Builder
  selectedClass: null,   // { id, name }
  selectedArm: null,     // { id, classId, name } | null — null means whole class (no arm)
  periods: [],           // Computed PeriodConfig[] — generated from periodConfig
  periodConfig: null,    // Raw wizard inputs: { id, schoolStart, periodDuration, totalPeriods, breaks[] }
  savedPeriodConfigs: [], // School-wide reusable configs fetched on init
  schedules: [],         // ScheduleEntry[]
  draftId: null,
  isDraft: true,
  isPublished: false,
  publishedAt: null,

  // Selection
  selectedEntryId: null,

  // Draft save
  lastSavedAt: null,
  isSaving: false,

  // Loading flags
  loading: { years: false, terms: false, classes: false, teachers: false, draft: false, arms: false },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function timetableReducer(state, action) {
  switch (action.type) {

    // ── Academic ──────────────────────────────────────────────────────────────
    case 'SET_ACADEMIC_YEARS':
      return { ...state, academicYears: action.payload };
    case 'ADD_ACADEMIC_YEAR':
      return { ...state, academicYears: [...state.academicYears, action.payload] };
    case 'UPDATE_ACADEMIC_YEAR':
      return { ...state, academicYears: state.academicYears.map(y => y.id === action.payload.id ? action.payload : y), selectedYear: state.selectedYear?.id === action.payload.id ? action.payload : state.selectedYear };
    case 'REMOVE_ACADEMIC_YEAR':
      return { ...state, academicYears: state.academicYears.filter(y => y.id !== action.id), selectedYear: state.selectedYear?.id === action.id ? null : state.selectedYear };
    case 'SELECT_YEAR':
      return { ...state, selectedYear: action.payload, selectedTerm: null, terms: [], periods: [], schedules: [], draftId: null, isPublished: false };
    // Atomic init: sets years list, selected year, terms list, and selected term in one
    // dispatch so there is never an intermediate state where year is set but term is null.
    case 'SET_ACADEMIC_CONTEXT':
      return {
        ...state,
        academicYears: action.payload.years ?? state.academicYears,
        selectedYear:  action.payload.year  ?? null,
        terms:         action.payload.terms ?? [],
        selectedTerm:  action.payload.term  ?? null,
      };
    case 'SET_TERMS':
      return { ...state, terms: action.payload };
    case 'ADD_TERM':
      return { ...state, terms: [...state.terms, action.payload] };
    case 'UPDATE_TERM':
      return { ...state, terms: state.terms.map(t => t.id === action.payload.id ? action.payload : t), selectedTerm: state.selectedTerm?.id === action.payload.id ? action.payload : state.selectedTerm };
    case 'REMOVE_TERM':
      return { ...state, terms: state.terms.filter(t => t.id !== action.id), selectedTerm: state.selectedTerm?.id === action.id ? null : state.selectedTerm };
    case 'SELECT_TERM':
      return { ...state, selectedTerm: action.payload, periods: [], schedules: [], draftId: null, isPublished: false };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'REMOVE_EVENT':
      return { ...state, events: state.events.filter(h => h.id !== action.id) };

    // ── Resources ─────────────────────────────────────────────────────────────
    case 'SET_CLASSES':
      return { ...state, classes: action.payload };
    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, action.payload] };
    case 'SET_TEACHERS':
      return { ...state, teachers: action.payload };
    case 'SET_SUBJECTS':
      return { ...state, subjects: action.payload };
    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] };
    case 'REMOVE_SUBJECT':
      return { ...state, subjects: state.subjects.filter(s => s.id !== action.id) };
    case 'ADD_ROOM':
      return { ...state, rooms: [...state.rooms, action.room] };
    case 'REMOVE_ROOM':
      return { ...state, rooms: state.rooms.filter(r => r !== action.room) };

    // ── Arms ──────────────────────────────────────────────────────────────────
    // SET_ARMS: replace the entire arms list (called after createArms or initial load)
    case 'SET_ARMS':
      return { ...state, arms: action.payload };

    // ADD_ARMS: append one or more newly created arms
    case 'ADD_ARMS': {
      const newArms = Array.isArray(action.payload) ? action.payload : [action.payload];
      return { ...state, arms: [...state.arms, ...newArms] };
    }

    // UPDATE_ARM: patch a single arm by id
    case 'UPDATE_ARM':
      return {
        ...state,
        arms: state.arms.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      };

    // REMOVE_ARM: delete an arm (and its cached subjects)
    case 'REMOVE_ARM': {
      const { [action.id]: _removed, ...restSubjects } = state.armSubjects;
      return {
        ...state,
        arms: state.arms.filter(a => a.id !== action.id),
        armSubjects: restSubjects,
      };
    }

    // REMOVE_CLASS_ARMS: wipe all arms belonging to a deleted class
    case 'REMOVE_CLASS_ARMS': {
      const survivingArms = state.arms.filter(a => a.classId !== action.classId);
      const removedIds = state.arms
        .filter(a => a.classId === action.classId)
        .map(a => a.id);
      const cleanedSubjects = { ...state.armSubjects };
      removedIds.forEach(id => delete cleanedSubjects[id]);
      return { ...state, arms: survivingArms, armSubjects: cleanedSubjects };
    }

    // ── Arm Subjects ──────────────────────────────────────────────────────────
    // SET_ARM_SUBJECTS: store the full subject list for a specific arm
    case 'SET_ARM_SUBJECTS':
      return {
        ...state,
        armSubjects: { ...state.armSubjects, [action.armId]: action.subjects },
      };

    // ADD_ARM_SUBJECTS: merge new subjects into an arm (additive, deduped by id)
    case 'ADD_ARM_SUBJECTS': {
      const existing = state.armSubjects[action.armId] || [];
      const existingIds = new Set(existing.map(s => s.id));
      const incoming = (action.subjects || []).filter(s => !existingIds.has(s.id));
      return {
        ...state,
        armSubjects: {
          ...state.armSubjects,
          [action.armId]: [...existing, ...incoming],
        },
      };
    }

    // REMOVE_ARM_SUBJECT: remove a single subject from an arm
    case 'REMOVE_ARM_SUBJECT': {
      const current = state.armSubjects[action.armId] || [];
      return {
        ...state,
        armSubjects: {
          ...state.armSubjects,
          [action.armId]: current.filter(s => s.id !== action.subjectId),
        },
      };
    }

    // COPY_ARM_SUBJECTS: stamp sourceArm's subjects onto one or more target arms
    case 'COPY_ARM_SUBJECTS': {
      const source = state.armSubjects[action.sourceArmId] || [];
      const updates = {};
      (action.targetArmIds || []).forEach(targetId => {
        const targetExisting = state.armSubjects[targetId] || [];
        const targetIds = new Set(targetExisting.map(s => s.id));
        updates[targetId] = [
          ...targetExisting,
          ...source.filter(s => !targetIds.has(s.id)),
        ];
      });
      return {
        ...state,
        armSubjects: { ...state.armSubjects, ...updates },
      };
    }

    // ── Class selection ───────────────────────────────────────────────────────
    // Changing class resets arm, periods, schedules and draft state.
    case 'SELECT_CLASS':
      return { ...state, selectedClass: action.payload, selectedArm: null, periods: [], schedules: [], draftId: null, selectedEntryId: null, isPublished: false };

    // ── Arm selection ─────────────────────────────────────────────────────────
    // Changing arm resets draft state so the new arm's timetable loads fresh.
    // Passing null means "whole class" (class has no arms).
    case 'SELECT_ARM':
      return { ...state, selectedArm: action.payload, periods: [], schedules: [], draftId: null, selectedEntryId: null, isPublished: false };

    // ── Periods config ────────────────────────────────────────────────────────
    case 'SET_PERIODS':
      return { ...state, periods: action.payload };

    // ── Schedule entries ──────────────────────────────────────────────────────
    case 'SET_DRAFT':
      return { ...state, schedules: action.schedules, periods: action.periods || [], draftId: action.draftId, isDraft: true };

    case 'ADD_SCHEDULE_ENTRY':
      return { ...state, schedules: [...state.schedules, action.payload] };

    case 'UPDATE_SCHEDULE_ENTRY':
      return {
        ...state,
        schedules: state.schedules.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    case 'MOVE_SCHEDULE_ENTRY':
      return {
        ...state,
        schedules: state.schedules.map(s =>
          s.id === action.id
            ? { ...s, dayOfWeek: action.day, periodId: action.periodId, startTime: action.startTime, endTime: action.endTime, periodNumber: action.periodNumber }
            : s
        ),
      };

    case 'REMOVE_SCHEDULE_ENTRY':
      return {
        ...state,
        schedules: state.schedules.filter(s => s.id !== action.id),
        selectedEntryId: state.selectedEntryId === action.id ? null : state.selectedEntryId,
      };

    case 'CLEAR_SCHEDULES':
      return { ...state, schedules: [], selectedEntryId: null };

    case 'CLEAR_PERIODS_AND_SCHEDULES':
      return { ...state, periods: [], schedules: [], selectedEntryId: null, draftId: null, isPublished: false, lastSavedAt: null };

    // ── Copy from another class/arm (bulk) ───────────────────────────────────
    case 'PASTE_SCHEDULES': {
      // Restamp classId/className/armId/armName to the current target, regenerate IDs.
      // Teacher assignments are not copied — they are arm/class specific.
      const { targetClass, targetArm, entries } = action;
      const stampedEntries = entries.map(e => ({
        ...e,
        id: uid(),
        classId: targetClass.id,
        className: targetClass.name,
        armId: targetArm?.id ?? null,
        armName: targetArm?.name ?? null,
        teacherId: null,
        teacherName: null,
      }));
      return { ...state, schedules: stampedEntries };
    }

    // ── Published ─────────────────────────────────────────────────────────────
    case 'SET_PUBLISHED':
      return { ...state, isPublished: true, isDraft: false, publishedAt: action.publishedAt };

    // ── UI selection ──────────────────────────────────────────────────────────
    case 'SELECT_ENTRY':
      return { ...state, selectedEntryId: action.id };
    case 'DESELECT_ENTRY':
      return { ...state, selectedEntryId: null };

    // ── Draft save state ──────────────────────────────────────────────────────
    case 'SET_SAVING':
      return { ...state, isSaving: action.value };
    case 'SET_SAVED':
      return { ...state, lastSavedAt: action.at, isSaving: false, draftId: action.draftId ?? state.draftId };

    // ── Loading ───────────────────────────────────────────────────────────────
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload } };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const TimetableContext = createContext(null);

export function TimetableProvider({ children }) {
  const [state, dispatch] = useReducer(timetableReducer, initialState);

  // Derived: conflict analysis (re-runs every time schedules change)
  const conflicts = useMemo(() => detectConflicts(state.schedules), [state.schedules]);
  const conflictedIds = useMemo(() => getConflictedEntryIds(conflicts), [conflicts]);
  const warnedIds = useMemo(() => getWarnedEntryIds(conflicts), [conflicts]);
  const hasErrors = useMemo(() => hasBlockingConflicts(conflicts), [conflicts]);

  // Derived: selected entry
  const selectedEntry = useMemo(
    () => state.schedules.find(s => s.id === state.selectedEntryId) ?? null,
    [state.schedules, state.selectedEntryId]
  );

  // Derived: schedule lookup by day+period (for WeeklyGrid)
  const scheduleByCell = useMemo(() => {
    const map = {};
    for (const entry of state.schedules) {
      const key = `${entry.dayOfWeek}__${entry.periodId}`;
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [state.schedules]);

  const value = {
    state,
    dispatch,
    // Derived
    conflicts,
    conflictedIds,
    warnedIds,
    hasErrors,
    selectedEntry,
    scheduleByCell,
  };

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const ctx = useContext(TimetableContext);
  if (!ctx) throw new Error('useTimetable must be used inside <TimetableProvider>');
  return ctx;
}
