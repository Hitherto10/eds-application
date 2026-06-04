import React, { createContext, useContext, useReducer, useMemo } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FeeContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Reducer-based store for the Fee & Payment Management Engine. Mirrors the
 * established TimetableContext pattern (useReducer + derived selectors) so the
 * finance module integrates seamlessly with the rest of the admin dashboard.
 *
 * Academic scope (year/term/class) is loaded by useFeeData() which reuses the
 * EXISTING timetable & class services — no duplicate fetching logic.
 */

const initialState = {
  // Academic scope (sourced from existing services)
  academicYears: [],
  selectedYear: null,
  terms: [],
  selectedTerm: null,
  classes: [],          // [{ id, name, level }]

  // Fee domain
  feeStructures: [],     // [{ id, name, items[], status, ... }]
  invoices: [],          // [{ id, studentId, amount, amountPaid, status, ... }]
  invoiceSummary: { totalBilled: 0, totalPaid: 0, totalOutstanding: 0 },
  analytics: null,       // /api/fees/analytics payload
  outstanding: [],       // outstanding-balances report rows

  // Loading flags
  loading: {
    scope: false,
    structures: false,
    invoices: false,
    analytics: false,
    reports: false,
  },
};

function feeReducer(state, action) {
  switch (action.type) {
    // ── Academic scope ────────────────────────────────────────────────────────
    case 'SET_ACADEMIC_YEARS':
      return { ...state, academicYears: action.payload };
    case 'SELECT_YEAR':
      return { ...state, selectedYear: action.payload, terms: [], selectedTerm: null };
    // Atomic init: sets all four academic-scope values in one dispatch so there is
    // never an intermediate render where year is set but terms/term are still null.
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
    case 'SELECT_TERM':
      return { ...state, selectedTerm: action.payload };
    case 'SET_CLASSES':
      return { ...state, classes: action.payload };

    // ── Fee structures ────────────────────────────────────────────────────────
    case 'SET_STRUCTURES':
      return { ...state, feeStructures: action.payload };
    case 'ADD_STRUCTURE':
      return { ...state, feeStructures: [action.payload, ...state.feeStructures] };
    case 'ADD_STRUCTURES':
      return { ...state, feeStructures: [...action.payload, ...state.feeStructures] };
    case 'UPDATE_STRUCTURE':
      return {
        ...state,
        feeStructures: state.feeStructures.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case 'REMOVE_STRUCTURE':
      return {
        ...state,
        feeStructures: state.feeStructures.filter(s => s.id !== action.id),
      };

    // ── Invoices ──────────────────────────────────────────────────────────────
    case 'SET_INVOICES':
      return {
        ...state,
        invoices: action.payload.invoices ?? action.payload,
        invoiceSummary: action.payload.summary ?? state.invoiceSummary,
      };
    case 'ADD_INVOICES':
      return { ...state, invoices: [...action.payload, ...state.invoices] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      };

    // ── Reports / analytics ───────────────────────────────────────────────────
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_OUTSTANDING':
      return { ...state, outstanding: action.payload };

    // ── Loading ───────────────────────────────────────────────────────────────
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload } };

    default:
      return state;
  }
}

const FeeContext = createContext(null);

export function FeeProvider({ children }) {
  const [state, dispatch] = useReducer(feeReducer, initialState);

  // Derived: structures scoped to the current year + term selection
  const scopedStructures = useMemo(() => {
    return state.feeStructures.filter(s => {
      const yearOk = !state.selectedYear || s.academicYearId === state.selectedYear.id;
      const termOk = !state.selectedTerm || s.termId === state.selectedTerm.id;
      return yearOk && termOk;
    });
  }, [state.feeStructures, state.selectedYear, state.selectedTerm]);

  // Derived: only published structures can generate invoices (2-phase lifecycle: draft → published)
  const billableStructures = useMemo(
    () => state.feeStructures.filter(s => s.status === 'published'),
    [state.feeStructures]
  );

  const value = { state, dispatch, scopedStructures, billableStructures };

  return <FeeContext.Provider value={value}>{children}</FeeContext.Provider>;
}

export function useFee() {
  const ctx = useContext(FeeContext);
  if (!ctx) throw new Error('useFee must be used inside <FeeProvider>');
  return ctx;
}
