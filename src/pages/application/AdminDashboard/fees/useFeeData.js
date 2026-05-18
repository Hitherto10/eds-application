import { useEffect, useState, useRef, useCallback } from 'react';
import { useFee } from './FeeContext.jsx';
import { getAcademicYears, getAcademicProfile, getTerms } from '../timetable/timetableAPIs.js';
import { getSchoolClasses } from '../services/classAPIs.js';
import {
    getFeeStructures,
    getInvoices,
    getFeeAnalytics,
} from '../services/feeAPIs.js';

/**
 * useFeeData
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic one-shot initialiser for the Fee module.
 *
 * Design principles (mirrors useGlobalTimetableData):
 *  • ONE useEffect with [] deps — runs exactly once on mount.
 *  • Sequential: years → terms → fee data — no cascades.
 *  • SET_ACADEMIC_CONTEXT dispatches year + terms + term atomically.
 *  • setInitialLoad(false) only fires after the atomic dispatch.
 *  • handleYearChange is returned so ScopeBar dropdowns can change year
 *    without relying on a cascade effect.
 *  • Fee data reloads via a separate effect keyed on year.id + term.id so it
 *    fires both on init (after context is set) and on user selections.
 */
export function useFeeData() {
    const { state, dispatch } = useFee();
    const [initialLoad, setInitialLoad] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // ── One-shot sequential initialisation ───────────────────────────────────
    useEffect(() => {
        async function init() {
            console.log('[FeeModule] ── init start ───────────────────────────────');

            try {
                // Step 1: fetch years + profile + classes in parallel
                console.log('[FeeModule] Step 1: fetching years, profile, classes');
                const [yearsRes, profileRes, classesRes] = await Promise.all([
                    getAcademicYears(),
                    getAcademicProfile(),
                    getSchoolClasses(),
                ]);

                if (!mountedRef.current) return;

                // Step 2: validate years
                console.log('[FeeModule] yearsRes:', yearsRes);
                const years = yearsRes?.data?.years ?? [];
                console.log('[FeeModule] Step 2: years =', years.length, years.map(y => `${y.name}(active:${y.isActive})`));

                if (years.length === 0) {
                    console.warn('[FeeModule] No academic years returned — cannot initialise year/term context.');
                    return;
                }

                // Step 3: pick default year (prefer school profile's currentAcademicYear)
                const profileYear = profileRes?.data?.currentAcademicYear;
                console.log('[FeeModule] Step 3: profile currentAcademicYear =', profileYear);

                const defaultYear = profileYear?.id
                    ? (years.find(y => y.id === profileYear.id) ?? years.find(y => y.isActive) ?? years[0])
                    : (years.find(y => y.isActive) ?? years[0]);

                console.log('[FeeModule] Step 3: defaultYear =', defaultYear?.name, defaultYear?.id);

                // Step 4: fetch terms for the chosen year
                console.log('[FeeModule] Step 4: fetching terms for yearId =', defaultYear.id);
                const termsRes = await getTerms(defaultYear.id);

                if (!mountedRef.current) return;

                console.log('[FeeModule] termsRes:', termsRes);
                const terms = termsRes?.data?.terms ?? [];
                console.log('[FeeModule] Step 4: terms =', terms.length, terms.map(t => `${t.name}(current:${t.isCurrent})`));

                // Step 5: pick default term (prefer school profile's currentTerm)
                const profileTerm = profileRes?.data?.currentTerm;
                console.log('[FeeModule] Step 5: profile currentTerm =', profileTerm);

                const defaultTerm = profileTerm?.id
                    ? (terms.find(t => t.id === profileTerm.id) ?? terms.find(t => t.isCurrent) ?? terms[0] ?? null)
                    : (terms.find(t => t.isCurrent) ?? terms[0] ?? null);

                console.log('[FeeModule] Step 5: defaultTerm =', defaultTerm?.name, defaultTerm?.id);

                // Step 6: dispatch year + terms + term atomically
                dispatch({ type: 'SET_ACADEMIC_CONTEXT', payload: { years, year: defaultYear, terms, term: defaultTerm } });

                if (classesRes?.success) {
                    dispatch({ type: 'SET_CLASSES', payload: classesRes.data?.classes ?? [] });
                }

                console.log('[FeeModule] ── init complete ──────────────────────────');

                // Fee data will load via the reactive effect below once selectedYear/selectedTerm are set.

            } catch (err) {
                console.error('[FeeModule] init failed:', err);
            } finally {
                if (mountedRef.current) setInitialLoad(false);
            }
        }

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — runs exactly once on mount

    // ── User-driven year change ───────────────────────────────────────────────
    // Sequential: fetches terms before dispatching so year + terms + term land
    // atomically and the ScopeBar never shows mismatched values.
    const handleYearChange = useCallback(async (yearId) => {
        const year = state.academicYears.find(y => y.id === yearId);
        if (!year) return;

        console.log('[FeeModule] handleYearChange: yearId =', yearId, year.name);

        try {
            const res = await getTerms(yearId);
            if (!mountedRef.current) return;

            const terms = res?.data?.terms ?? [];
            const term = terms.find(t => t.isCurrent) ?? terms[0] ?? null;

            console.log('[FeeModule] handleYearChange: terms =', terms.length, '| selected =', term?.name);
            dispatch({ type: 'SET_ACADEMIC_CONTEXT', payload: { year, terms, term } });
        } catch (err) {
            console.error('[FeeModule] handleYearChange failed:', err);
        }
    }, [state.academicYears, dispatch]);

    // ── Reactive: reload fee data when year or term changes ──────────────────
    // Fires both after init (context set) and after user selection changes.
    const selectedYearId = state.selectedYear?.id;
    const selectedTermId = state.selectedTerm?.id;

    useEffect(() => {
        if (!selectedYearId) return;
        let cancelled = false;

        const scope = {
            academicYearId: selectedYearId,
            ...(selectedTermId ? { termId: selectedTermId } : {}),
        };

        async function loadFeeData() {
            console.log('[FeeModule] loadFeeData: scope =', scope);
            dispatch({ type: 'SET_LOADING', payload: { structures: true, invoices: true, analytics: true } });
            try {
                const [resStruct, resInv, resAnalytics] = await Promise.all([
                    getFeeStructures(scope),
                    getInvoices(scope),
                    getFeeAnalytics(scope),
                ]);

                if (cancelled) return;

                if (resStruct?.success) {
                    dispatch({ type: 'SET_STRUCTURES', payload: resStruct.data?.feeStructures ?? [] });
                }
                if (resInv?.success) {
                    dispatch({
                        type: 'SET_INVOICES',
                        payload: {
                            invoices: resInv.data?.invoices ?? [],
                            summary: resInv.data?.summary,
                        },
                    });
                }
                if (resAnalytics?.success) {
                    dispatch({ type: 'SET_ANALYTICS', payload: resAnalytics.data });
                }

                console.log('[FeeModule] loadFeeData: complete');
            } catch (err) {
                console.error('[FeeModule] loadFeeData failed:', err);
            } finally {
                if (!cancelled) {
                    dispatch({ type: 'SET_LOADING', payload: { structures: false, invoices: false, analytics: false } });
                }
            }
        }

        loadFeeData();
        return () => { cancelled = true; };
    }, [selectedYearId, selectedTermId, dispatch]);

    return { initialLoad, handleYearChange };
}
