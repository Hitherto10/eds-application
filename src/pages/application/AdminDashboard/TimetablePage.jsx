import React, { useState, useEffect } from 'react';
import { useTimetable } from './timetable/TimetableContext';
import { CalendarDays, Settings2, Loader2, LayoutGrid } from 'lucide-react';

import AcademicCalendarBuilder from './timetable/AcademicCalendarBuilder';
import TimetableBuilder from './timetable/TimetableBuilder';
import SubjectSetupBuilder from './timetable/components/SubjectSetupBuilder';
import ClassSetupBuilder from './timetable/components/ClassSetupBuilder';
import TimetableSecondarySidebar from './timetable/components/TimetableSecondarySidebar';

// API
import { getAcademicYears, getTerms, getHolidays, getTimetableDraft, getPublishedTimetable } from './timetable/timetableAPIs';
import { getSchoolClasses } from './services/classAPIs';
import * as adminService from './services/adminService';
// authAPIs removed as we longer borrow teacher classes for global taxonomy

/**
 * TimetablePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Top-level container. Mounts the TimetableProvider internally?
 * Actually, we should probably wrap this specific page in Provider, or do it inside here.
 * I will wrap the internal content in TimetableProvider.
 */
import { TimetableProvider } from './timetable/TimetableContext';
import AdminLayout from "./components/layout/AdminLayout.jsx";
import {getSchoolSubjects} from "./services/subjectAPIs.js";

function TimetableContent() {
  const { state, dispatch } = useTimetable();
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'calendar' | 'timetable'
  const [initialLoad, setInitialLoad] = useState(true);

  const normalizePeriods = (rawPeriods) => {
    if (!Array.isArray(rawPeriods)) return [];
    return rawPeriods.filter(p => p && typeof p === 'object' && p.id && p.start && p.end);
  };

  // 1. Initial Data Fetch (Years, Classes, Teachers)
  useEffect(() => {
    async function loadGlobals() {
      dispatch({ type: 'SET_LOADING', payload: { years: true, classes: true, teachers: true } });
      try {
        // Parallel fetch base requirements
        const [
          resYears,
          resClasses,
          resTeachers,
          resSubjects
        ] = await Promise.all([
          getAcademicYears(),
          getSchoolClasses(),
          adminService.getDashboardUsers(), // Need users to filter out teachers
          getSchoolSubjects()
        ]);

        if (resYears.success) {
          dispatch({ type: 'SET_ACADEMIC_YEARS', payload: resYears.data.academicYears });
          // Auto-select active year if exists
          const active = resYears.data.academicYears.find(y => y.isActive) || resYears.data.academicYears[0];
          if (active) dispatch({ type: 'SELECT_YEAR', payload: active });
        }

        if (resClasses && resClasses.success) {
          dispatch({ type: 'SET_CLASSES', payload: resClasses.data.classes });
        }

        if (resTeachers && resTeachers.success && Array.isArray(resTeachers.data.users)) {
          const teachersOnly = resTeachers.data.users.filter(u => u.role === 'teacher').map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
          }));
          dispatch({ type: 'SET_TEACHERS', payload: teachersOnly });
        }

        if (resSubjects && resSubjects.success) {
          dispatch({ type: 'SET_SUBJECTS', payload: resSubjects.data.subjects });
        }
      } catch (err) {
        console.error('Failed to load global timetable configs:', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { years: false, classes: false, teachers: false } });
        setInitialLoad(false);
      }
    }
    loadGlobals();
  }, [dispatch]);

  // 2. Cascade load Terms when Year changes
  useEffect(() => {
    if (!state.selectedYear) return;
    async function loadTerms() {
      dispatch({ type: 'SET_LOADING', payload: { terms: true } });
      const res = await getTerms(state.selectedYear.id);
      if (res.success) {
        dispatch({ type: 'SET_TERMS', payload: res.data.terms });
        if (res.data.terms.length > 0) {
           dispatch({ type: 'SELECT_TERM', payload: res.data.terms[0] });
        }
      }
      dispatch({ type: 'SET_LOADING', payload: { terms: false } });
    }
    loadTerms();
  }, [state.selectedYear, dispatch]);

  // 3. Cascade load Holidays when Term changes
  useEffect(() => {
    if (!state.selectedTerm) return;
    async function loadHolidays() {
      const res = await getHolidays(state.selectedTerm.id);
      if (res.success) dispatch({ type: 'SET_HOLIDAYS', payload: res.data.holidays });
    }
    loadHolidays();
  }, [state.selectedTerm, dispatch]);

  // 4. Load Timetable Draft/Published when Class + Term change
  useEffect(() => {
    if (!state.selectedClass || !state.selectedTerm) return;

    async function loadScheduleContext() {
      dispatch({ type: 'SET_LOADING', payload: { draft: true } });
      
      // Check published first
      const pubRes = await getPublishedTimetable(state.selectedClass.id, state.selectedTerm.id);
      
      if (pubRes.success && pubRes.data.timetable) {
         const periods = normalizePeriods(pubRes.data.timetable.periods);
         dispatch({ 
           type: 'SET_DRAFT', 
           periods,
           schedules: pubRes.data.timetable.schedules,
           draftId: null
         });
         dispatch({ type: 'SET_PUBLISHED', publishedAt: pubRes.data.timetable.publishedAt });
      } else {
        // No published? Check draft.
        const draftRes = await getTimetableDraft(state.selectedClass.id, state.selectedTerm.id);
        if (draftRes.success && draftRes.data.draft) {
           const periods = normalizePeriods(draftRes.data.draft.periods);
           dispatch({ 
             type: 'SET_DRAFT', 
             periods,
             schedules: draftRes.data.draft.schedules,
             draftId: draftRes.data.draft.id
           });
           if (draftRes.data.draft.updatedAt) {
             dispatch({ type: 'SET_SAVED', at: draftRes.data.draft.updatedAt });
           }
        } else {
           // Completely empty
           dispatch({ type: 'CLEAR_PERIODS_AND_SCHEDULES' });
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: { draft: false } });
    }
    
    loadScheduleContext();
  }, [state.selectedClass, state.selectedTerm, dispatch]);


  if (initialLoad) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[70vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Booting Academic Engine...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full lg:h-[calc(100vh-80px)] overflow-hidden">
      <TimetableSecondarySidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden p-2 lg:p-6 bg-gray-50/30">
      
      {/* Global Builder Context Bar (Class Selector) - Only show on timetable tab */}
      {activeTab === 'timetable' && (
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
               {state.classes.map(c =>
                     <option key={c.id} value={c.id}>
                       {c.name}
                     </option>)
               }
            </select>
          </div>

          <div className="w-px h-6 bg-gray-200 hidden md:block" />

          <div className="flex items-center gap-2 text-sm text-gray-600">
             <span className="font-semibold">{state.selectedYear?.name || 'No Year Active'}</span>
             <span>•</span>
             <span>{state.selectedTerm?.name || 'No Term Active'}</span>
          </div>
          
          {state.loading.draft && (
            <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Loader2 size={12} className="animate-spin" /> Fetching data...
            </div>
          )}
        </div>
      )}

      {/* Core Working Area */}
      {activeTab === 'subjects' && <SubjectSetupBuilder />}
      {activeTab === 'classes' && <ClassSetupBuilder />}
      {activeTab === 'calendar' && <AcademicCalendarBuilder />}
      {activeTab === 'timetable' && <TimetableBuilder />}
      
      </div>
    </div>
  );
}

export default function TimetablePage() {
  return (
      <AdminLayout isMiniSidebar={true}>
        <TimetableProvider>
          <TimetableContent />
        </TimetableProvider>
      </AdminLayout>
  );
}

