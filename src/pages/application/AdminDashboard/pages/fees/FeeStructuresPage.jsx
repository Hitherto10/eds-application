import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import ScopeBar from '../../components/ScopeBar.jsx';
import { useAcademic } from '../../../../../contexts/AcademicContext.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { getSchoolClasses } from '../../services/classAPIs.js';
import { getFeeStructures } from '../../services/feeAPIs.js';
import FeeStructuresTab from '../../fees/components/FeeStructuresTab.jsx';

function FeeStructuresContent() {
    const { loading: scopeLoading, currentYear, currentTerm } = useAcademic();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    const [classes, setClasses] = useState([]);
    const [structures, setStructures] = useState([]);

    // Classes are reference data — fetch once.
    useEffect(() => {
        getSchoolClasses()
            .then(res => { if (res?.success) setClasses(res.data?.classes ?? []); })
            .catch(err => console.error('[FeeStructures] classes failed:', err));
    }, []);

    // Structures are scoped to the active year/term.
    useEffect(() => {
        if (!currentYear?.id) return;
        let cancelled = false;
        getFeeStructures({
            academicYearId: currentYear.id,
            ...(currentTerm?.id ? { termId: currentTerm.id } : {}),
        })
            .then(res => { if (!cancelled && res?.success) setStructures(res.data?.feeStructures ?? []); })
            .catch(err => console.error('[FeeStructures] structures failed:', err));
        return () => { cancelled = true; };
    }, [currentYear?.id, currentTerm?.id]);

    if (scopeLoading) {
        return (
            <div className="flex flex-col items-center h-full justify-center py-32">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Fee Structures...</p>
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
                    <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
                    <p className="text-sm text-gray-500 mt-1">Define and manage fee templates per class and term.</p>
                </div>
                <ScopeBar />
            </div>
            <FeeStructuresTab
                showToast={showToast}
                classes={classes}
                currentYear={currentYear}
                currentTerm={currentTerm}
                structures={structures}
                setStructures={setStructures}
            />
        </div>
    );
}

export default function FeeStructuresPage() {
    return (
        <AdminLayout>
            <FeeStructuresContent />
        </AdminLayout>
    );
}
