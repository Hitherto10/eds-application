import { useState, useEffect } from 'react';
import { useTimetable } from './TimetableContext.jsx';
import {
    getAcademicYears,
    getTerms,
    getHolidays,
    getTimetableDraft,
    getPublishedTimetable,
} from './timetableAPIs.js';
import { getSchoolClasses } from '../services/classAPIs.js';
import { getSchoolSubjects } from '../services/subjectAPIs.js';
import * as adminService from '../services/adminService.js';

/**
 * useGlobalTimetableData
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared data-loading hook used by all four config sub-pages.
 * Handles: academic years, terms, holidays, classes, teachers, subjects,
 * and the timetable draft/published cascade.
 *
 * Returns { initialLoad } so callers can show a spinner before first render.
 */
export function useGlobalTimetableData() {
    const { state, dispatch } = useTimetable();
    const [initialLoad, setInitialLoad] = useState(true);

    const normalizePeriods = (rawPeriods) => {
        if (!Array.isArray(rawPeriods)) return [];
        return rawPeriods.filter(p => p && typeof p === 'object' && p.id && p.start && p.end);
    };

    // 1. Initial Data Fetch (Years, Classes, Teachers, Subjects)
    useEffect(() => {
        async function loadGlobals() {
            dispatch({ type: 'SET_LOADING', payload: { years: true, classes: true, teachers: true } });
            try {
                const [resYears, resClasses, resTeachers, resSubjects] = await Promise.all([
                    getAcademicYears(),
                    getSchoolClasses(),
                    adminService.getDashboardUsers(),
                    getSchoolSubjects(),
                ]);

                if (resYears.success) {
                    dispatch({ type: 'SET_ACADEMIC_YEARS', payload: resYears.data.academicYears });
                    const active = resYears.data.academicYears.find(y => y.isActive) || resYears.data.academicYears[0];
                    if (active) dispatch({ type: 'SELECT_YEAR', payload: active });
                }

                if (resClasses?.success) {
                    dispatch({ type: 'SET_CLASSES', payload: resClasses.data.classes });
                }

                if (resTeachers?.success && Array.isArray(resTeachers.data.users)) {
                    const teachersOnly = resTeachers.data.users
                        .filter(u => u.role === 'teacher')
                        .map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }));
                    dispatch({ type: 'SET_TEACHERS', payload: teachersOnly });
                }

                if (resSubjects?.success) {
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

            const pubRes = await getPublishedTimetable(state.selectedClass.id, state.selectedTerm.id);

            if (pubRes.success && pubRes.data.timetable) {
                const periods = normalizePeriods(pubRes.data.timetable.periods);
                dispatch({
                    type: 'SET_DRAFT',
                    periods,
                    schedules: pubRes.data.timetable.schedules,
                    draftId: null,
                });
                dispatch({ type: 'SET_PUBLISHED', publishedAt: pubRes.data.timetable.publishedAt });
            } else {
                const draftRes = await getTimetableDraft(state.selectedClass.id, state.selectedTerm.id);
                if (draftRes.success && draftRes.data.draft) {
                    const periods = normalizePeriods(draftRes.data.draft.periods);
                    dispatch({
                        type: 'SET_DRAFT',
                        periods,
                        schedules: draftRes.data.draft.schedules,
                        draftId: draftRes.data.draft.id,
                    });
                    if (draftRes.data.draft.updatedAt) {
                        dispatch({ type: 'SET_SAVED', at: draftRes.data.draft.updatedAt });
                    }
                } else {
                    dispatch({ type: 'CLEAR_PERIODS_AND_SCHEDULES' });
                }
            }

            dispatch({ type: 'SET_LOADING', payload: { draft: false } });
        }

        loadScheduleContext();
    }, [state.selectedClass, state.selectedTerm, dispatch]);

    return { initialLoad };
}