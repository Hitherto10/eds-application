import React, { useState } from 'react';
import {
  recordPayment,
  initializePayment,
  verifyPayment,
  formatNaira,
  toKobo,
  PAYMENT_METHODS,
} from '../../services/feeAPIs.js';
import { X, Loader2, CreditCard, Banknote, ShieldCheck } from 'lucide-react';

/**
 * RecordPaymentModal
 * Handles BOTH manual recording (cash/bank/pos/cheque) and online gateway
 * checkout (Paystack/Flutterwave) with the init → verify round-trip.
 *
 * Props: { invoice, onClose, onRecorded(updatedInvoice, payment), showToast }
 */
export default function RecordPaymentModal({ invoice, onClose, onRecorded, showToast }) {
  const due = invoice.amountDue ?? invoice.amount ?? 0;

  const [method, setMethod]     = useState('cash');
  const [amount, setAmount]     = useState(due ? due / 100 : '');
  const [reference, setReference] = useState('');
  const [note, setNote]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [gatewayRef, setGatewayRef] = useState(null);

  const methodMeta = PAYMENT_METHODS.find(m => m.id === method);
  const isGateway  = methodMeta?.kind === 'gateway';

  const handleManual = async () => {
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    setBusy(true);
    try {
      const res = await recordPayment(invoice.id, {
        amount: toKobo(amount),
        paymentMethod: method,
        referenceNumber: reference || undefined,
        note: note || undefined,
        paidAt: new Date().toISOString(),
      });
      if (res.success) {
        const paid = (invoice.amountPaid || 0) + toKobo(amount);
        const total = invoice.amount || toKobo(amount);
        const status = paid >= total ? 'paid' : 'partial';
        onRecorded(
          { id: invoice.id, amountPaid: paid, amountDue: Math.max(0, total - paid), status },
          res.data.payment
        );
        showToast('Payment recorded successfully');
        onClose();
      }
    } catch (e) {
      showToast(e.message || 'Failed to record payment', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleGatewayInit = async () => {
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    setBusy(true);
    try {
      const res = await initializePayment(invoice.id, {
        gateway: method,
        amount: toKobo(amount),
        email: invoice.parentEmail || invoice.studentEmail || 'parent@example.com',
        callbackUrl: window.location.href,
      });
      if (res.success) {
        setGatewayRef(res.data.reference);
        // In production this opens res.data.authorizationUrl in a popup/redirect.
        window.open(res.data.authorizationUrl, '_blank', 'noopener');
        showToast('Checkout opened — complete payment then verify');
      }
    } catch (e) {
      showToast(e.message || 'Failed to initialize gateway', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    try {
      const res = await verifyPayment({ reference: gatewayRef, gateway: method });
      if (res.success && res.data.status === 'confirmed') {
        const paidAmt = res.data.payment.amount || toKobo(amount);
        const paid = (invoice.amountPaid || 0) + paidAmt;
        const total = invoice.amount || paidAmt;
        const status = paid >= total ? 'paid' : 'partial';
        onRecorded(
          { id: invoice.id, amountPaid: paid, amountDue: Math.max(0, total - paid), status },
          res.data.payment
        );
        showToast('Gateway payment confirmed');
        onClose();
      } else {
        showToast('Payment not yet confirmed', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Verification failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Record Payment</h3>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Invoice summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Student</span>
                <span className="font-semibold text-gray-800">{invoice.studentName || invoice.studentId}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Invoice Total</span>
                <span className="font-semibold text-gray-800">{formatNaira(invoice.amount)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Outstanding</span>
                <span className="font-bold text-red-600">{formatNaira(due)}</span>
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setGatewayRef(null); }}
                    className={`px-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      method === m.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Partial payments allowed — invoice stays "partial" until fully settled.
              </p>
            </div>

            {/* Manual-only fields */}
            {!isGateway && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Reference / Teller No.
                  </label>
                  <input
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="e.g. TXN-009912"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Note (optional)</label>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </>
            )}

            {/* Gateway notice */}
            {isGateway && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                <span>
                  A secure {methodMeta.label} checkout opens in a new tab. After payment,
                  click <strong>Verify</strong> to confirm and post to the ledger.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            {!isGateway ? (
              <button
                onClick={handleManual}
                disabled={busy}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                Record Payment
              </button>
            ) : !gatewayRef ? (
              <button
                onClick={handleGatewayInit}
                disabled={busy}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                Pay with {methodMeta.label}
              </button>
            ) : (
              <button
                onClick={handleVerify}
                disabled={busy}
                className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Verify Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
