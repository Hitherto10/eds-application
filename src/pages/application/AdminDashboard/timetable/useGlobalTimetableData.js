import { useState, useEffect, useRef } from 'react';
import { useTimetable } from './TimetableContext.jsx';
import { useAcademic } from '../../../../contexts/AcademicContext.jsx';
import {
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
 * Loads the timetable builder's *reference resources* (classes, arms, teachers,
 * subjects) once on mount, and reloads the active draft whenever the selected
 * class / arm / term changes.
 *
 * Academic scope (year + term) is NO LONGER managed here — it lives in the global
 * AcademicContext. Reference resources (classes, arms, teachers, subjects) are
 * fetched here into local state and RETURNED to the page, which passes them down
 * to the builder panels as props. Everything else (selectedClass, selectedArm,
 * schedules, periods) is the builder's own editor state in TimetableContext.
 */
const ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Library', 'Gym'];

export function useGlobalTimetableData() {
    const { state, dispatch } = useTimetable();
    const { currentTerm } = useAcademic();
    const [initialLoad, setInitialLoad] = useState(true);

    // Reference resources — owned here, fetched directly from the APIs.
    const [classes, setClasses] = useState([]);
    const [arms, setArms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const normalizePeriods = (rawPeriods) => {
        if (!Array.isArray(rawPeriods)) return [];
        return rawPeriods.filter(p => p && typeof p === 'object' && p.id && p.start && p.end);
    };

    // ── Load builder reference resources once on mount ────────────────────────
    useEffect(() => {
        async function loadResources() {
            try {
                const [classesRes, teachersRes, subjectsRes] = await Promise.all([
                    getSchoolClasses(),
                    adminService.getDashboardUsers(),
                    getSchoolSubjects(),
                ]);
                if (!mountedRef.current) return;

                if (classesRes?.success) {
                    const cls = classesRes.data?.classes ?? [];
                    setClasses(cls);

                    if (cls.length > 0) {
                        const armResults = await Promise.all(cls.map(c => getClassArms(c.id)));
                        if (!mountedRef.current) return;
                        setArms(armResults.flatMap(r => r?.data?.arms ?? []));
                    }
                }

                if (teachersRes?.success && Array.isArray(teachersRes.data?.users)) {
                    setTeachers(
                        teachersRes.data.users
                            .filter(u => u.role === 'teacher')
                            .map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))
                    );
                }

                if (subjectsRes?.success) {
                    setSubjects(subjectsRes.data?.subjects ?? []);
                }
            } catch (err) {
                console.error('[Timetable] resource load failed:', err);
            } finally {
                if (mountedRef.current) setInitialLoad(false);
            }
        }

        loadResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run exactly once on mount

    // ── Reactive: reload the draft when class, arm, or term changes ───────────
    const selectedTermId = currentTerm?.id;
    const selectedClassId = state.selectedClass?.id;
    const selectedArmId = state.selectedArm?.id ?? null;
    const classHasArms = Boolean(
        selectedClassId && arms.some(a => a.classId === selectedClassId)
    );

    useEffect(() => {
        // Require class + term. When the class has arms, require an explicit arm.
        if (!selectedClassId || !selectedTermId) return;
        if (classHasArms && selectedArmId === null) return;

        let cancelled = false;

        async function loadDraft() {
            dispatch({ type: 'SET_LOADING', payload: { draft: true } });
            try {
                const pubRes = await getPublishedTimetable(selectedClassId, selectedTermId, selectedArmId);
                if (cancelled) return;

                if (pubRes?.success && pubRes.data?.timetable) {
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

    return {
        initialLoad,
        resources: { classes, arms, teachers, subjects, rooms: ROOMS },
    };
}
