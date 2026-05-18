import React, { useState } from 'react';
import { useFee } from '../FeeContext.jsx';
import {
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  transitionFeeStructure,
  cloneFeeStructure,
  formatNaira,
  toKobo,
  sumItems,
  FEE_TYPES,
  STRUCTURE_STATUS,
} from '../../services/feeAPIs.js';
import {
  Plus,
  Trash2,
  Pencil,
  Copy,
  Lock,
  Send,
  CheckCircle2,
  Undo2,
  X,
  Loader2,
  FileStack,
} from 'lucide-react';

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const s = STRUCTURE_STATUS[status] || STRUCTURE_STATUS.draft;
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${s.style}`}>
      {s.label}
    </span>
  );
};

// ─── Builder modal ────────────────────────────────────────────────────────────
function StructureBuilder({ initial, onClose, onSaved, showToast }) {
  const { state } = useFee();
  const isEdit = Boolean(initial?.id);

  const [name, setName]               = useState(initial?.name || '');
  const [classId, setClassId]         = useState(initial?.classId || '');
  const [dueDate, setDueDate]         = useState(initial?.dueDate || '');
  const [paymentType, setPaymentType] = useState(initial?.paymentType || 'one-time');
  const [items, setItems]             = useState(
    initial?.items?.map(i => ({ ...i, amount: i.amount / 100 })) || [
      { feeType: 'tuition', name: 'Tuition', amount: '', optional: false },
    ]
  );
  const [plans, setPlans] = useState(
    initial?.installmentPlans || [{ label: '1st Installment', percentage: 50, dueDate: '' }]
  );
  const [saving, setSaving] = useState(false);

  const updateItem = (idx, patch) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () =>
    setItems([...items, { feeType: 'miscellaneous', name: '', amount: '', optional: true }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const updatePlan = (idx, patch) =>
    setPlans(plans.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const addPlan = () =>
    setPlans([...plans, { label: `${plans.length + 1} Installment`, percentage: 0, dueDate: '' }]);
  const removePlan = (idx) => setPlans(plans.filter((_, i) => i !== idx));

  const totalNaira = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  const handleSave = async () => {
    if (!name.trim())  return showToast('Structure name is required', 'error');
    if (!classId)      return showToast('Select a class', 'error');
    if (items.some(i => !i.name.trim() || !i.amount))
      return showToast('Each fee item needs a name and amount', 'error');
    if (paymentType === 'installment') {
      const totalPct = plans.reduce((a, p) => a + (Number(p.percentage) || 0), 0);
      if (totalPct !== 100)
        return showToast(`Installment percentages must total 100% (currently ${totalPct}%)`, 'error');
    }

    const cls = state.classes.find(c => c.id === classId);
    const payload = {
      academicYearId: state.selectedYear?.id,
      termId: state.selectedTerm?.id,
      classId,
      className: cls?.name || '',
      name: name.trim(),
      items: items.map(i => ({
        feeType: i.feeType,
        name: i.name.trim(),
        amount: toKobo(i.amount),
        optional: !!i.optional,
      })),
      totalAmount: toKobo(totalNaira),
      dueDate,
      paymentType,
      ...(paymentType === 'installment' ? { installmentPlans: plans } : {}),
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await updateFeeStructure(initial.id, payload)
        : await createFeeStructure(payload);
      if (res.success) {
        onSaved(res.data.feeStructure, isEdit);
        showToast(isEdit ? 'Fee structure updated' : 'Fee structure created (draft)');
        onClose();
      }
    } catch (e) {
      showToast(e.message || 'Failed to save structure', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">
              {isEdit ? 'Edit Fee Structure' : 'New Fee Structure'}
            </h3>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Structure Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. JSS1 First Term Fees"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Class *</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Select class…</option>
                  {state.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="one-time">One-time</option>
                  <option value="installment">Installment</option>
                </select>
              </div>
            </div>

            {/* Fee items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Fee Items</label>
                <button
                  onClick={addItem}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={13} /> Add item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <select
                      value={it.feeType}
                      onChange={e => {
                        const ft = FEE_TYPES.find(f => f.id === e.target.value);
                        updateItem(idx, {
                          feeType: e.target.value,
                          name: it.name || ft?.label || '',
                          optional: ft?.optional ?? it.optional,
                        });
                      }}
                      className="px-2 py-1.5 border border-gray-200 rounded text-xs bg-white w-36"
                    >
                      {FEE_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <input
                      value={it.name}
                      onChange={e => updateItem(idx, { name: e.target.value })}
                      placeholder="Display name"
                      className="flex-1 min-w-32 px-2 py-1.5 border border-gray-200 rounded text-xs"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400">₦</span>
                      <input
                        type="number"
                        value={it.amount}
                        onChange={e => updateItem(idx, { amount: e.target.value })}
                        placeholder="0"
                        className="w-32 pl-5 pr-2 py-1.5 border border-gray-200 rounded text-xs"
                      />
                    </div>
                    <label className="flex items-center gap-1 text-[11px] text-gray-600 select-none">
                      <input
                        type="checkbox"
                        checked={!!it.optional}
                        onChange={e => updateItem(idx, { optional: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      Optional
                    </label>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right mt-2 text-sm font-bold text-gray-800">
                Total: {formatNaira(toKobo(totalNaira))}
              </div>
            </div>

            {/* Installment plans */}
            {paymentType === 'installment' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Installment Plans</label>
                  <button
                    onClick={addPlan}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add plan
                  </button>
                </div>
                <div className="space-y-2">
                  {plans.map((p, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-amber-50/50 border border-amber-100 rounded-lg p-2">
                      <input
                        value={p.label}
                        onChange={e => updatePlan(idx, { label: e.target.value })}
                        placeholder="Label"
                        className="flex-1 min-w-32 px-2 py-1.5 border border-gray-200 rounded text-xs"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          value={p.percentage}
                          onChange={e => updatePlan(idx, { percentage: Number(e.target.value) })}
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded text-xs"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">%</span>
                      </div>
                      <input
                        type="date"
                        value={p.dueDate}
                        onChange={e => updatePlan(idx, { dueDate: e.target.value })}
                        className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                      />
                      {plans.length > 1 && (
                        <button
                          onClick={() => removePlan(idx)}
                          className="p-1 text-gray-300 hover:text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function FeeStructuresTab({ showToast }) {
  const { state, dispatch, scopedStructures } = useFee();
  const [builder, setBuilder] = useState(null); // null | {} | structure

  const handleSaved = (structure, isEdit) => {
    dispatch({ type: isEdit ? 'UPDATE_STRUCTURE' : 'ADD_STRUCTURE', payload: structure, id: structure.id });
  };

  const handleTransition = async (s, action) => {
    try {
      const res = await transitionFeeStructure(s.id, action);
      if (res.success) {
        dispatch({ type: 'UPDATE_STRUCTURE', payload: { id: s.id, ...res.data.feeStructure } });
        showToast(res.message);
      }
    } catch (e) {
      showToast(e.message || 'Transition failed', 'error');
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete draft "${s.name}"?`)) return;
    try {
      const res = await deleteFeeStructure(s.id);
      if (res.success) {
        dispatch({ type: 'REMOVE_STRUCTURE', id: s.id });
        showToast('Fee structure deleted');
      }
    } catch (e) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  const handleClone = async (s) => {
    try {
      const res = await cloneFeeStructure(s.id, {
        targetAcademicYearId: state.selectedYear?.id,
        targetTermId: state.selectedTerm?.id,
        targetClassIds: [s.classId],
      });
      if (res.success) {
        const cloned = res.data.feeStructures?.length
          ? res.data.feeStructures
          : [{ ...s, id: `clone_${Date.now()}`, name: `${s.name} (Copy)`, status: 'draft', version: 1 }];
        dispatch({ type: 'ADD_STRUCTURES', payload: cloned });
        showToast('Structure cloned as draft');
      }
    } catch (e) {
      showToast(e.message || 'Clone failed', 'error');
    }
  };

  const transitionBtn = (s) => {
    switch (s.status) {
      case 'draft':
        return { label: 'Submit for Review', icon: Send, action: 'submit_review' };
      case 'review':
        return { label: 'Publish', icon: CheckCircle2, action: 'publish' };
      case 'published':
        return { label: 'Lock', icon: Lock, action: 'lock' };
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-800">
            Fee Structures ({scopedStructures.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {state.selectedYear?.name} {state.selectedTerm ? `· ${state.selectedTerm.name}` : ''} — draft → review → publish → lock
          </p>
        </div>
        <button
          onClick={() => setBuilder({})}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> New Structure
        </button>
      </div>

      {/* List */}
      <div className="p-5 space-y-3">
        {scopedStructures.length === 0 ? (
          <div className="text-center py-16">
            <FileStack size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No fee structures for this scope</p>
            <p className="text-xs text-gray-400 mt-1">Create one to begin billing.</p>
          </div>
        ) : (
          scopedStructures.map(s => {
            const tb = transitionBtn(s);
            const editable = s.status === 'draft' || s.status === 'review';
            return (
              <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{s.name}</h3>
                      <StatusPill status={s.status} />
                      <span className="text-[10px] text-gray-400 font-bold uppercase">v{s.version || 1}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.className || '—'} · {s.items?.length || 0} item(s) ·{' '}
                      <span className="font-semibold text-gray-700">
                        {formatNaira(s.totalAmount ?? sumItems(s.items))}
                      </span>
                      {s.paymentType === 'installment' && ' · installment'}
                      {s.dueDate && ` · due ${s.dueDate}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tb && (
                      <button
                        onClick={() => handleTransition(s, tb.action)}
                        className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                      >
                        <tb.icon size={12} /> {tb.label}
                      </button>
                    )}
                    {s.status !== 'draft' && s.status !== 'locked' && (
                      <button
                        onClick={() => handleTransition(s, 'revert_draft')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                        title="Revert to draft"
                      >
                        <Undo2 size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleClone(s)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Clone"
                    >
                      <Copy size={14} />
                    </button>
                    {editable && (
                      <button
                        onClick={() => setBuilder(s)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {s.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items preview */}
                {s.items?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {s.items.map((it, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-600"
                      >
                        {it.name}: {formatNaira(it.amount)}
                        {it.optional && <span className="text-amber-500 ml-1">(opt)</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {builder && (
        <StructureBuilder
          initial={builder.id ? builder : null}
          onClose={() => setBuilder(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
    </div>
  );
}
