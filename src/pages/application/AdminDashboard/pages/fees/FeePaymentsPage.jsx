import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import ScopeBar from '../../components/ScopeBar.jsx';
import { useAcademic } from '../../../../../contexts/AcademicContext.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import FeePaymentsTab from '../../fees/components/FeePaymentsTab.jsx';

function FeePaymentsContent() {
    const { loading: scopeLoading, currentYear } = useAcademic();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    if (scopeLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 h-full">
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
                    <h1 className="text-2xl font-bold text-gray-900">Payments &amp; Ledger</h1>
                    <p className="text-sm text-gray-500 mt-1">Record payments and view per-student ledger entries.</p>
                </div>
                <ScopeBar />
            </div>
            <FeePaymentsTab showToast={showToast} currentYear={currentYear} />
        </div>
    );
}

export default function FeePaymentsPage() {
    return (
        <AdminLayout>
            <FeePaymentsContent />
        </AdminLayout>
    );
}
