import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import { FeeProvider, useFee } from '../fees/FeeContext.jsx';
import { useFeeData } from '../fees/useFeeData.js';
import { Toast } from '../components/ui/Toast.jsx';
import {
  LayoutDashboard,
  ReceiptText,
  FileStack,
  Wallet,
  BarChart3,
} from 'lucide-react';

import FeeOverviewTab   from '../fees/components/FeeOverviewTab.jsx';
import FeeStructuresTab from '../fees/components/FeeStructuresTab.jsx';
import FeeInvoicesTab   from '../fees/components/FeeInvoicesTab.jsx';
import FeePaymentsTab   from '../fees/components/FeePaymentsTab.jsx';
import FeeReportsTab    from '../fees/components/FeeReportsTab.jsx';

const TABS = [
  { id: 'overview',   label: 'Overview',         icon: LayoutDashboard, Comp: FeeOverviewTab   },
  { id: 'structures', label: 'Fee Structures',   icon: FileStack,       Comp: FeeStructuresTab },
  { id: 'invoices',   label: 'Invoices',         icon: ReceiptText,     Comp: FeeInvoicesTab   },
  { id: 'payments',   label: 'Payments & Ledger', icon: Wallet,         Comp: FeePaymentsTab   },
  { id: 'reports',    label: 'Reports',          icon: BarChart3,       Comp: FeeReportsTab    },
];

// ─── Academic scope selector (reuses loaded years/terms) ──────────────────────
function ScopeBar() {
  const { state, dispatch } = useFee();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={state.selectedYear?.id || ''}
        onChange={(e) => {
          const y = state.academicYears.find(x => x.id === e.target.value);
          if (y) dispatch({ type: 'SELECT_YEAR', payload: y });
        }}
        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {state.academicYears.length === 0 && <option>No academic years</option>}
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
        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {state.terms.length === 0 && <option>All terms</option>}
        {state.terms.map(t => (
          <option key={t.id} value={t.id}>{t.name}{t.isCurrent ? ' (Current)' : ''}</option>
        ))}
      </select>
    </div>
  );
}

function FeeContent() {
  const { initialLoad } = useFeeData();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type });

  const ActiveComp = TABS.find(t => t.id === activeTab)?.Comp || FeeOverviewTab;

  if (initialLoad) {
    return (
      <div className="flex flex-col items-center content-center h-full justify-center py-32">
          <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Finance Module...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-5">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee &amp; Payment Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ledger-based fee engine — structures, billing, payments, arrears &amp; reports.
          </p>
        </div>
        <ScopeBar />
      </div>

      {/* Tab nav */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 flex flex-wrap gap-1">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active tab */}
      <ActiveComp showToast={showToast} />
    </div>
  );
}

export default function FeeManagementPage() {
  return (
    <AdminLayout className={`content-center`}>
      <FeeProvider>
        <FeeContent />
      </FeeProvider>
    </AdminLayout>
  );
}
