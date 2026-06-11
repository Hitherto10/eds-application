import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import ScopeBar from '../../components/ScopeBar.jsx';
import { useAcademic } from '../../../../../contexts/AcademicContext.jsx';
import { TableSkeleton } from '../../../../../components/patterns';
import { getSchoolClasses } from '../../services/classAPIs.js';
import { getInvoices } from '../../services/feeAPIs.js';
import FeeInvoicesTab from '../../fees/components/FeeInvoicesTab.jsx';

function FeeInvoicesContent() {
    const { loading: scopeLoading, currentYear, currentTerm } = useAcademic();

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

    return (
        <div className="flex flex-col h-full gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage student fee invoices.</p>
                </div>
                <ScopeBar />
            </div>
            {scopeLoading ? (
                <TableSkeleton />
            ) : (
                <FeeInvoicesTab classes={classes} invoices={invoices} summary={summary} />
            )}
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
