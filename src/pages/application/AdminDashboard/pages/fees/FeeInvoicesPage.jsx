import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import ScopeBar from '../../components/ScopeBar.jsx';
import { useAcademic } from '../../../../../contexts/AcademicContext.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { getSchoolClasses } from '../../services/classAPIs.js';
import { getInvoices } from '../../services/feeAPIs.js';
import FeeInvoicesTab from '../../fees/components/FeeInvoicesTab.jsx';

function FeeInvoicesContent() {
    const { loading: scopeLoading, currentYear, currentTerm } = useAcademic();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    const [classes, setClasses] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState({ totalBilled: 0, totalPaid: 0, totalOutstanding: 0 });

    useEffect(() => {
        getSchoolClasses()
            .then(res => { if (res?.success) setClasses(res.data?.classes ?? []); })
            .catch(err => console.error('[FeeInvoices] classes failed:', err));
    }, []);

    useEffect(() => {
        if (!currentYear?.id) return;
        let cancelled = false;
        getInvoices({
            academicYearId: currentYear.id,
            ...(currentTerm?.id ? { termId: currentTerm.id } : {}),
        })
            .then(res => {
                if (cancelled || !res?.success) return;
                setInvoices(res.data?.invoices ?? []);
                if (res.data?.summary) setSummary(res.data.summary);
            })
            .catch(err => console.error('[FeeInvoices] invoices failed:', err));
        return () => { cancelled = true; };
    }, [currentYear?.id, currentTerm?.id]);

    // Patch a single invoice in place (used after void / record-payment).
    const handleUpdateInvoice = (patch) =>
        setInvoices(prev => prev.map(i => (i.id === patch.id ? { ...i, ...patch } : i)));

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
                    <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage student fee invoices.</p>
                </div>
                <ScopeBar />
            </div>
            <FeeInvoicesTab
                showToast={showToast}
                classes={classes}
                invoices={invoices}
                summary={summary}
                onUpdateInvoice={handleUpdateInvoice}
            />
        </div>
    );
}

export default function FeeInvoicesPage() {
    return (
        <AdminLayout>
            <FeeInvoicesContent />
        </AdminLayout>
    );
}
