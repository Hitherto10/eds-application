import React, { useState, useMemo } from 'react';
import { useFee } from '../FeeContext.jsx';
import {
  generateInvoicesForClass,
  getInvoices,
  voidInvoice,
  formatNaira,
  INVOICE_STATUS,
} from '../../services/feeAPIs.js';
import RecordPaymentModal from './RecordPaymentModal.jsx';
import StudentLedgerModal from './StudentLedgerModal.jsx';
import {
  Search,
  Zap,
  Loader2,
  ReceiptText,
  Wallet,
  BookText,
  Ban,
} from 'lucide-react';

const SummaryCard = ({ label, value, tone }) => (
  <div className={`flex-1 min-w-[160px] p-4 rounded-xl border ${tone}`}>
    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
    <p className="text-xl font-black text-gray-900 mt-1">{value}</p>
  </div>
);

export default function FeeInvoicesTab({ showToast }) {
  const { state, dispatch, billableStructures } = useFee();

  const [genStructureId, setGenStructureId] = useState('');
  const [generating, setGenerating]         = useState(false);
  const [statusFilter, setStatusFilter]     = useState('all');
  const [classFilter, setClassFilter]       = useState('all');
  const [search, setSearch]                 = useState('');
  const [payInvoice, setPayInvoice]         = useState(null);
  const [ledgerStudent, setLedgerStudent]   = useState(null);

  const handleGenerate = async () => {
    if (!genStructureId) return showToast('Select a published structure', 'error');
    const structure = billableStructures.find(s => s.id === genStructureId);
    setGenerating(true);
    try {
      const res = await generateInvoicesForClass({
        feeStructureId: genStructureId,
        classId: structure?.classId,
      });
      if (res.success) {
        // Refresh invoice list from source of truth
        const scope = {
          academicYearId: state.selectedYear?.id,
          ...(state.selectedTerm ? { termId: state.selectedTerm.id } : {}),
        };
        const list = await getInvoices(scope);
        if (list.success) {
          dispatch({
            type: 'SET_INVOICES',
            payload: { invoices: list.data.invoices, summary: list.data.summary },
          });
        }
        showToast(
          `Generated ${res.data.generated} invoice(s)` +
          (res.data.skipped ? `, ${res.data.skipped} skipped (already billed)` : '')
        );
      }
    } catch (e) {
      showToast(e.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleVoid = async (inv) => {
    const reason = prompt(`Reason for voiding invoice for ${inv.studentName || inv.studentId}?`);
    if (!reason) return;
    try {
      const res = await voidInvoice(inv.id, reason);
      if (res.success) {
        dispatch({ type: 'UPDATE_INVOICE', payload: { id: inv.id, status: 'void' } });
        showToast('Invoice voided');
      }
    } catch (e) {
      showToast(e.message || 'Void failed', 'error');
    }
  };

  const filtered = useMemo(() => {
    return state.invoices.filter(inv => {
      const sOk = statusFilter === 'all' || inv.status === statusFilter;
      const cOk = classFilter === 'all' || inv.classId === classFilter;
      const term = search.trim().toLowerCase();
      const qOk = !term ||
        (inv.studentName || '').toLowerCase().includes(term) ||
        (inv.feeStructureName || '').toLowerCase().includes(term);
      return sOk && cOk && qOk;
    });
  }, [state.invoices, statusFilter, classFilter, search]);

  const sm = state.invoiceSummary;

  return (
    <div className="space-y-5">
      {/* Generate panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Generate Invoices</h3>
        <p className="text-xs text-gray-500 mb-4">
          Bulk-bill an entire class from a <strong>published</strong> fee structure. Idempotent —
          students already billed are skipped.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={genStructureId}
            onChange={e => setGenStructureId(e.target.value)}
            className="flex-1 min-w-[240px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">Select published structure…</option>
            {billableStructures.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.className} ({formatNaira(s.totalAmount)})
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating || !genStructureId}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            Generate
          </button>
        </div>
        {billableStructures.length === 0 && (
          <p className="text-xs text-amber-600 mt-3">
            No published structures yet — publish one in the “Fee Structures” tab first.
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Total Billed"      value={formatNaira(sm.totalBilled)}      tone="bg-blue-50/50 border-blue-100" />
        <SummaryCard label="Total Collected"   value={formatNaira(sm.totalPaid)}        tone="bg-green-50/50 border-green-100" />
        <SummaryCard label="Total Outstanding" value={formatNaira(sm.totalOutstanding)} tone="bg-amber-50/50 border-amber-100" />
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Invoices ({filtered.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All classes</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All statuses</option>
              {Object.keys(INVOICE_STATUS).map(s => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student / structure…"
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ReceiptText size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No invoices yet</p>
            <p className="text-xs text-gray-400 mt-1">Generate invoices from a published structure above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50">
                <tr className="text-[11px] uppercase text-gray-500">
                  <th className="p-4">Student</th>
                  <th className="p-4">Structure</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Paid</th>
                  <th className="p-4 text-right">Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">{inv.studentName || inv.studentId}</p>
                      <p className="text-xs text-gray-400">{inv.className}</p>
                    </td>
                    <td className="p-4 text-gray-600">{inv.feeStructureName || '—'}</td>
                    <td className="p-4 text-right text-gray-700">{formatNaira(inv.amount)}</td>
                    <td className="p-4 text-right text-green-600">{formatNaira(inv.amountPaid)}</td>
                    <td className="p-4 text-right font-semibold text-red-600">
                      {formatNaira(inv.amountDue ?? (inv.amount - (inv.amountPaid || 0)))}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {inv.status !== 'paid' && inv.status !== 'void' && (
                          <button
                            onClick={() => setPayInvoice(inv)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                          >
                            <Wallet size={12} /> Pay
                          </button>
                        )}
                        <button
                          onClick={() => setLedgerStudent({ id: inv.studentId, name: inv.studentName })}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="View ledger"
                        >
                          <BookText size={14} />
                        </button>
                        {inv.status !== 'void' && (
                          <button
                            onClick={() => handleVoid(inv)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="Void invoice"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payInvoice && (
        <RecordPaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onRecorded={(patch) => dispatch({ type: 'UPDATE_INVOICE', payload: patch })}
          showToast={showToast}
        />
      )}
      {ledgerStudent && (
        <StudentLedgerModal student={ledgerStudent} onClose={() => setLedgerStudent(null)} />
      )}
    </div>
  );
}
