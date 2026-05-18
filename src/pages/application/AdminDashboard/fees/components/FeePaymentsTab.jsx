import React, { useState, useEffect, useCallback } from 'react';
import { useFee } from '../FeeContext.jsx';
import {
  getAllPayments,
  applyAdjustment,
  formatNaira,
  toKobo,
  PAYMENT_METHODS,
  ADJUSTMENT_TYPES,
} from '../../services/feeAPIs.js';
import StudentLedgerModal from './StudentLedgerModal.jsx';
import ReceiptModal from './ReceiptModal.jsx';
import {
  Search,
  Loader2,
  Receipt,
  BookText,
  SlidersHorizontal,
  X,
  Wallet,
} from 'lucide-react';

// ─── Adjustment modal (discount / waiver / scholarship / correction) ──────────
function AdjustmentModal({ onClose, onApplied, showToast }) {
  const [studentId, setStudentId] = useState('');
  const [type, setType]           = useState('discount');
  const [amount, setAmount]       = useState('');
  const [reason, setReason]       = useState('');
  const [busy, setBusy]           = useState(false);

  const submit = async () => {
    if (!studentId.trim()) return showToast('Student ID is required', 'error');
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    if (!reason.trim()) return showToast('A reason is required for audit trail', 'error');
    setBusy(true);
    try {
      const res = await applyAdjustment({
        studentId: studentId.trim(),
        type,
        amount: toKobo(amount),
        reason: reason.trim(),
        approvedBy: 'admin',
      });
      if (res.success) {
        onApplied?.(res.data.adjustment);
        showToast('Adjustment applied to ledger');
        onClose();
      }
    } catch (e) {
      showToast(e.message || 'Failed to apply adjustment', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Apply Adjustment</h3>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Student ID</label>
              <input
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="stu_..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {ADJUSTMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Reason (audit)</label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function FeePaymentsTab({ showToast }) {
  const { state } = useFee();

  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [methodFilter, setMethod] = useState('all');
  const [lookup, setLookup]       = useState('');
  const [ledgerStudent, setLedger] = useState(null);
  const [receiptId, setReceiptId]  = useState(null);
  const [showAdjust, setShowAdjust] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllPayments({
        academicYearId: state.selectedYear?.id,
        ...(methodFilter !== 'all' ? { method: methodFilter } : {}),
      });
      if (res.success) setPayments(res.data.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [state.selectedYear, methodFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
            Look up Student Ledger
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={lookup}
                onChange={e => setLookup(e.target.value)}
                placeholder="Enter student ID…"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={() => lookup.trim() && setLedger({ id: lookup.trim(), name: lookup.trim() })}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black flex items-center gap-2"
            >
              <BookText size={15} /> View Ledger
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAdjust(true)}
          className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <SlidersHorizontal size={15} /> Apply Adjustment
        </button>
      </div>

      {/* Payments feed */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Payments Feed ({payments.length})</h2>
          <select
            value={methodFilter}
            onChange={e => setMethod(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All methods</option>
            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" /> Loading payments…
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <Wallet size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No payments recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Recorded &amp; gateway payments will stream here for reconciliation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50">
                <tr className="text-[11px] uppercase text-gray-500">
                  <th className="p-4">Receipt</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-xs text-gray-600">{p.receiptNumber}</td>
                    <td className="p-4 text-gray-700">{p.studentName || p.studentId}</td>
                    <td className="p-4 capitalize text-gray-600">{(p.method || '').replace('_', ' ')}</td>
                    <td className="p-4 text-right font-semibold text-green-600">{formatNaira(p.amount)}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setReceiptId(p.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                        >
                          <Receipt size={12} /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ledgerStudent && (
        <StudentLedgerModal student={ledgerStudent} onClose={() => setLedger(null)} />
      )}
      {receiptId && (
        <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} showToast={showToast} />
      )}
      {showAdjust && (
        <AdjustmentModal onClose={() => setShowAdjust(false)} showToast={showToast} />
      )}
    </div>
  );
}
