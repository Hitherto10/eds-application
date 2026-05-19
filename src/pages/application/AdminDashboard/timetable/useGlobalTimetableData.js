import { useState, useEffect, useRef, useCallback } from 'react';
import { useTimetable } from './TimetableContext.jsx';
import {
    getAcademicYears,
    getAcademicProfile,
    getTerms,
    getEvents,
    getTimetableDraft,
    getPublishedTimetable,
} from './timetableAPIs.js';
import { getSchoolClasses } from '../services/classAPIs.js';
import { getClassArms } from '../services/armAPIs.js';
import { getSchoolSubjects } from '../services/subjectAPIs.js';
import * as adminService from '../services/adminService.js';

/**
 * useGlobalTimetableData
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic one-shot initialiser for the timetable module.
 *
 * Design principles:
 *  • ONE useEffect with [] deps — runs exactly once on mount, never again.
 *  • Everything inside is sequential: years → terms → resources.
 *  • A single SET_ACADEMIC_CONTEXT dispatch sets year + terms + term atomically,
 *    so there is never a render where year is set but term is still null.
 *  • setInitialLoad(false) is called only AFTER that atomic dispatch.
 *  • User-driven year changes go through handleYearChange (returned from hook)
 *    which is also sequential — no cascade effects needed.
 *  • Draft/events reload via separate effects keyed on .id, NOT the whole object
 *    (avoids stale-reference re-fires).
 */
export function useGlobalTimetableData() {
    const { state, dispatch } = useTimetable();
    const [initialLoad, setInitialLoad] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const normalizePeriods = (rawPeriods) => {
        if (!Array.isArray(rawPeriods)) return [];
        return rawPeriods.filter(p => p && typeof p === 'object' && p.id && p.start && p.end);
    };

    // ── One-shot sequential initialisation ───────────────────────────────────
    useEffect(() => {
        async function init() {
            console.log('[Timetable] ── init start ──────────────────────────────');

            try {
                // ── Step 1: fetch years + profile + resources in parallel ──────
                console.log('[Timetable] Step 1: fetching years, profile, classes, teachers, subjects');
                const [yearsRes, profileRes, classesRes, teachersRes, subjectsRes] = await Promise.all([
                    getAcademicYears(),
                    getAcademicProfile(),
                    getSchoolClasses(),
                    adminService.getDashboardUsers(),
                    getSchoolSubjects(),
                ]);

                if (!mountedRef.current) return;

                // ── Step 2: validate years ────────────────────────────────────
                console.log('[Timetable] yearsRes:', yearsRes);
                const years = yearsRes?.data?.years ?? [];
                console.log('[Timetable] Step 2: years loaded =', years.length, years.map(y => `${y.name}(active:${y.isActive})`));

                if (years.length === 0) {
                    console.warn('[Timetable] No academic years returned — cannot initialise year/term context.');
                    return;
                }

                // ── Step 3: pick the default year ─────────────────────────────
                const profileYear = profileRes?.data?.currentAcademicYear;
                console.log('[Timetable] Step 3: profile currentAcademicYear =', profileYear);

                const defaultYear = profileYear?.id
                    ? (years.find(y => y.id === profileYear.id) ?? years.find(y => y.isActive) ?? years[0])
                    : (years.find(y => y.isActive) ?? years[0]);

                console.log('[Timetable] Step 3: defaultYear resolved =', defaultYear?.name, defaultYear?.id);

                // ── Step 4: fetch terms for the chosen year ───────────────────
                console.log('[Timetable] Step 4: fetching terms for yearId =', defaultYear.id);
                const termsRes = await getTerms(defaultYear.id);

                if (!mountedRef.current) return;

                console.log('[Timetable] termsRes:', termsRes);
                const terms = termsRes?.data?.terms ?? [];
                console.log('[Timetable] Step 4: terms loaded =', terms.length, terms.map(t => `${t.name}(current:${t.isCurrent})`));

                // ── Step 5: pick the default term ─────────────────────────────
                const profileTerm = profileRes?.data?.currentTerm;
                console.log('[Timetable] Step 5: profile currentTerm =', profileTerm);

                const defaultTerm = profileTerm?.id
                    ? (terms.find(t => t.id === profileTerm.id) ?? terms.find(t => t.isCurrent) ?? terms[0] ?? null)
                    : (terms.find(t => t.isCurrent) ?? terms[0] ?? null);

                console.log('[Timetable] Step 5: defaultTerm resolved =', defaultTerm?.name, defaultTerm?.id);

                // ── Step 6: dispatch everything atomically ────────────────────
                // SET_ACADEMIC_CONTEXT sets years + year + terms + term in a single
                // reducer call — no intermediate renders with null term.
                dispatch({ type: 'SET_ACADEMIC_CONTEXT', payload: { years, year: defaultYear, terms, term: defaultTerm } });

                // Resources (non-blocking — dispatch individually after context is set)
                if (classesRes?.success) {
                    const classes = classesRes.data?.classes ?? [];
                    console.log('[Timetable] Step 6: classes =', classes.length);
                    dispatch({ type: 'SET_CLASSES', payload: classes });

                    if (classes.length > 0) {
                        const armResults = await Promise.all(classes.map(c => getClassArms(c.id)));
                        const allArms = armResults.flatMap(r => r?.data?.arms ?? []);
                        console.log('[Timetable] Step 6: arms loaded =', allArms.length);
                        dispatch({ type: 'SET_ARMS', payload: allArms });
                    }
                } else {
                    console.warn('[Timetable] Step 6: classesRes not successful', classesRes);
                }

                if (teachersRes?.success && Array.isArray(teachersRes.data?.users)) {
                    const teachers = teachersRes.data.users
                        .filter(u => u.role === 'teacher')
                        .map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }));
                    console.log('[Timetable] Step 6: teachers =', teachers.length);
                    dispatch({ type: 'SET_TEACHERS', payload: teachers });
                }

                if (subjectsRes?.success) {
                    const subjects = subjectsRes.data?.subjects ?? [];
                    console.log('[Timetable] Step 6: subjects =', subjects.length);
                    dispatch({ type: 'SET_SUBJECTS', payload: subjects });
                }

                console.log('[Timetable] ── init complete ─────────────────────────');

            } catch (err) {
                console.error('[Timetable] init failed:', err);
            } finally {
                if (mountedRef.current) setInitialLoad(false);
            }
        }

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — this must run exactly once on mount

    // ── User-driven year change (called from the TimetablePage dropdown) ──────
    // Sequential: fetches terms for the new year before dispatching anything,
    // so there is no intermediate render with mismatched year/terms.
    const handleYearChange = useCallback(async (yearId) => {
        const year = state.academicYears.find(y => y.id === yearId);
        if (!year) return;

        console.log('[Timetable] handleYearChange: yearId =', yearId, year.name);
        dispatch({ type: 'SET_LOADING', payload: { terms: true } });

        try {
            const res = await getTerms(yearId);
            if (!mountedRef.current) return;

            const terms = res?.data?.terms ?? [];
            const term = terms.find(t => t.isCurrent) ?? terms[0] ?? null;

            console.log('[Timetable] handleYearChange: terms =', terms.length, '| selected =', term?.name);

            // Atomic: set year + terms + term together
            dispatch({ type: 'SET_ACADEMIC_CONTEXT', payload: { year, terms, term } });
        } catch (err) {
            console.error('[Timetable] handleYearChange failed:', err);
        } finally {
            if (mountedRef.current) dispatch({ type: 'SET_LOADING', payload: { terms: false } });
        }
    }, [state.academicYears, dispatch]);

    // ── Reactive: reload events when the active term changes ─────────────────
    const selectedTermId = state.selectedTerm?.id;
    useEffect(() => {
        if (!selectedTermId) return;
        getEvents(selectedTermId).then(res => {
            if (!mountedRef.current) return;
            if (res?.success) dispatch({ type: 'SET_EVENTS', payload: res.data?.events ?? [] });
        }).catch(err => console.error('[Timetable] getEvents failed:', err));
    }, [selectedTermId, dispatch]);

    // ── Reactive: reload timetable draft when class, arm, OR term changes ────
    // selectedArmId may be null — that is valid and means "whole class" draft.
    // We only skip loading if class or term is missing; arm being null is fine.
    const selectedClassId = state.selectedClass?.id;
    const selectedArmId = state.selectedArm?.id ?? null;

    // Tracks whether the class has arms — used to decide if arm selection is required.
    const classHasArms = Boolean(
        selectedClassId && state.arms.some(a => a.classId === selectedClassId)
    );

    useEffect(() => {
        // Require class + term. Also require an arm to be explicitly chosen
        // when the class has arms (null arm = still choosing → don't load yet).
        if (!selectedClassId || !selectedTermId) return;
        if (classHasArms && selectedArmId === null) return;

        let cancelled = false;

        async function loadDraft() {
            dispatch({ type: 'SET_LOADING', payload: { draft: true } });
            console.log('[Timetable] loadDraft: classId =', selectedClassId, '| termId =', selectedTermId, '| armId =', selectedArmId);
            try {
                const pubRes = await getPublishedTimetable(selectedClassId, selectedTermId, selectedArmId);
                if (cancelled) return;

                if (pubRes?.success && pubRes.data?.timetable) {
                    console.log('[Timetable] loadDraft: found published timetable');
                    dispatch({
                        type: 'SET_DRAFT',
                        periods: normalizePeriods(pubRes.data.timetable.periods),
                        schedules: pubRes.data.timetable.schedules ?? [],
                        draftId: null,
                    });
                    dispatch({ type: 'SET_PUBLISHED', publishedAt: pubRes.data.timetable.publishedAt });
                    return;
                }

                const draftRes = await getTimetableDraft(selectedClassId, selectedTermId, selectedArmId);
                if (cancelled) return;

                if (draftRes?.success && draftRes.data?.draft) {
                    console.log('[Timetable] loadDraft: found draft');
                    dispatch({
                        type: 'SET_DRAFT',
                        periods: normalizePeriods(draftRes.data.draft.periods),
                        schedules: draftRes.data.draft.schedules ?? [],
                        draftId: draftRes.data.draft.id,
                    });
                    if (draftRes.data.draft.updatedAt) {
                        dispatch({ type: 'SET_SAVED', at: draftRes.data.draft.updatedAt });
                    }
                } else {
                    console.log('[Timetable] loadDraft: no draft found, clearing');
                    dispatch({ type: 'CLEAR_PERIODS_AND_SCHEDULES' });
                }
            } catch (err) {
                console.error('[Timetable] loadDraft failed:', err);
            } finally {
                if (!cancelled) dispatch({ type: 'SET_LOADING', payload: { draft: false } });
            }
        }

        loadDraft();
        return () => { cancelled = true; };
    }, [selectedClassId, selectedArmId, selectedTermId, classHasArms, dispatch]);

    return { initialLoad, handleYearChange };
}
