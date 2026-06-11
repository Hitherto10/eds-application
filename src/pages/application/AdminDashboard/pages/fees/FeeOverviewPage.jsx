import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import ScopeBar from '../../components/ScopeBar.jsx';
import { useAcademic } from '../../../../../contexts/AcademicContext.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { getFeeAnalytics } from '../../services/feeAPIs.js';
import FeeOverviewTab from '../../fees/components/FeeOverviewTab.jsx';

function FeeOverviewContent() {
    const { loading: scopeLoading, currentYear, currentTerm } = useAcademic();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Reload analytics whenever the academic scope changes.
    useEffect(() => {
        if (!currentYear?.id) return;
        let cancelled = false;
        setLoading(true);
        getFeeAnalytics({
            academicYearId: currentYear.id,
            ...(currentTerm?.id ? { termId: currentTerm.id } : {}),
        })
            .then(res => { if (!cancelled && res?.success) setAnalytics(res.data); })
            .catch(err => console.error('[FeeOverview] analytics failed:', err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [currentYear?.id, currentTerm?.id]);

    if (scopeLoading) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Summary of fees, collections, and outstanding balances.</p>
                </div>
                <ScopeBar />
            </div>
            <FeeOverviewTab analytics={analytics} loading={loading} showToast={showToast} />
        </div>
    );
}

export default function FeeOverviewPage() {
    return (
        <AdminLayout>
            <FeeOverviewContent />
        </AdminLayout>
    );
}
