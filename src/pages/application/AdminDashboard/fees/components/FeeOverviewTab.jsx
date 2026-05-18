import React from 'react';
import { useFee } from '../FeeContext.jsx';
import { formatNaira } from '../../services/feeAPIs.js';
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Target,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const StatCard = ({ title, value, sub, icon: Icon, tone }) => (
  <div className={`p-5 rounded-xl border ${tone.border} ${tone.bg} flex flex-col gap-3`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
      <Icon size={18} className={tone.icon} />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function FeeOverviewTab() {
  const { state } = useFee();
  const a = state.analytics;

  if (state.loading.analytics && !a) {
    return <p className="text-sm text-gray-400 py-16 text-center">Loading analytics…</p>;
  }

  if (!a) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <Wallet size={36} className="mx-auto text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-500">No analytics yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Publish a fee structure and generate invoices to populate finance analytics.
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Expected', value: formatNaira(a.totalExpected),
      sub: `${a.studentsBilled || 0} students billed`,
      icon: Target,
      tone: { bg: 'bg-blue-50/50', border: 'border-blue-100', icon: 'text-blue-500' },
    },
    {
      title: 'Total Collected', value: formatNaira(a.totalCollected),
      sub: `${a.studentsFullyPaid || 0} fully paid`,
      icon: Wallet,
      tone: { bg: 'bg-green-50/50', border: 'border-green-100', icon: 'text-green-500' },
    },
    {
      title: 'Outstanding', value: formatNaira(a.totalPending),
      sub: `${a.studentsOwing || 0} students owing`,
      icon: AlertTriangle,
      tone: { bg: 'bg-amber-50/50', border: 'border-amber-100', icon: 'text-amber-500' },
    },
    {
      title: 'Collection Rate', value: `${(a.collectionRate || 0).toFixed(1)}%`,
      sub: 'of total expected',
      icon: TrendingUp,
      tone: { bg: 'bg-violet-50/50', border: 'border-violet-100', icon: 'text-violet-500' },
    },
  ];

  const miniStats = [
    { label: 'Students Billed',  value: a.studentsBilled || 0,    icon: Users,        color: 'text-blue-600 bg-blue-50' },
    { label: 'Fully Paid',       value: a.studentsFullyPaid || 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Owing',            value: a.studentsOwing || 0,     icon: Clock,        color: 'text-amber-600 bg-amber-50' },
  ];

  const maxClassExpected = Math.max(1, ...(a.byClass || []).map(c => c.expected || 0));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => <StatCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection by class */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Collection by Class</h3>
          {(a.byClass || []).length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No class billing data yet.</p>
          ) : (
            <div className="space-y-4">
              {a.byClass.map(c => {
                const pct = c.expected ? Math.round((c.collected / c.expected) * 100) : 0;
                return (
                  <div key={c.classId || c.className}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{c.className}</span>
                      <span className="text-gray-500">
                        {formatNaira(c.collected)} / {formatNaira(c.expected)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (c.expected / maxClassExpected) * pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side mini stats + method split */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            {miniStats.map(m => (
              <div key={m.label} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color}`}>
                  <m.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-lg font-bold text-gray-900">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">By Payment Method</h3>
            {(a.byMethod || []).length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No payments recorded.</p>
            ) : (
              <div className="space-y-2">
                {a.byMethod.map(m => (
                  <div key={m.method} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{m.method.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">{formatNaira(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
