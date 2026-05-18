import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { FeeProvider, useFee } from '../../fees/FeeContext.jsx';
import { useFeeData } from '../../fees/useFeeData.js';
import { Toast } from '../../components/ui/Toast.jsx';
import FeeInvoicesTab from '../../fees/components/FeeInvoicesTab.jsx';

function ScopeBar({ handleYearChange }) {
    const { state, dispatch } = useFee();
    return (
        <div className="flex flex-wrap items-center gap-3">
            <select
                value={state.selectedYear?.id || ''}
                onChange={(e) => handleYearChange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
                {state.academicYears.map(y => (
                    <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>
                ))}
            </select>
            <select
                value={state.selectedTerm?.id || ''}
                onChange={(e) => {
                    const t = state.terms.find(x => x.id === e.target.value);
                    if (t) dispatch({ type: 'SELECT_TERM', payload: t });
                }}
                disabled={state.terms.length === 0}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
                {state.terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.isCurrent ? ' (Current)' : ''}</option>
                ))}
            </select>
        </div>
    );
}

function FeeInvoicesContent() {
    const { initialLoad, handleYearChange } = useFeeData();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    if (initialLoad) {
        return (
            <div className="flex flex-col items-center h-full justify-center py-32">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Finance Module...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-5">
            {toast.show && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            )}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage student fee invoices.</p>
                </div>
                <ScopeBar handleYearChange={handleYearChange} />
            </div>
            <FeeInvoicesTab showToast={showToast} />
        </div>
    );
}

export default function FeeInvoicesPage() {
    return (
        <AdminLayout>
            <FeeProvider>
                <FeeInvoicesContent />
            </FeeProvider>
        </AdminLayout>
    );
}
