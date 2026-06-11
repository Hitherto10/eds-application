import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import { formatNaira, INVOICE_STATUS } from '../../services/feeAPIs.js';
import { WorkbenchTable, StatusChip } from '../../../../../components/patterns';
import { ROUTES } from '../../navigation/navConfig.js';

const SummaryCard = ({ label, value, tone }) => (
  <div className={`flex-1 min-w-40 p-4 rounded-xl border ${tone}`}>
    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
    <p className="text-xl font-black text-gray-900 mt-1">{value}</p>
  </div>
);

/**
 * FeeInvoicesTab — migrated onto WorkbenchTable. Rows open the Invoice detail
 * page, where Pay / Void / Ledger actions live. Statuses use the platform StatusChip.
 */
export default function FeeInvoicesTab({ classes = [], invoices = [], summary = {} }) {
  const navigate = useNavigate();

  const classOptions = useMemo(
    () => classes.map(c => ({ value: c.id, label: c.name })),
    [classes]
  );

  const columns = useMemo(() => [
    {
      id: 'student', header: 'Student', accessor: r => r.studentName || r.studentId, sortable: true, hideable: false,
      render: r => (
        <div>
          <p className="font-semibold text-gray-800">{r.studentName || r.studentId}</p>
          <p className="text-xs text-gray-400">{r.className}</p>
        </div>
      ),
    },
    { id: 'structure', header: 'Structure', accessor: r => r.feeStructureName || '—', render: r => <span className="text-gray-600">{r.feeStructureName || '—'}</span> },
    { id: 'amount', header: 'Amount', accessor: r => r.amount, sortable: true, align: 'right', render: r => <span className="text-gray-700">{formatNaira(r.amount)}</span> },
    { id: 'paid', header: 'Paid', accessor: r => r.amountPaid, align: 'right', render: r => <span className="text-green-600">{formatNaira(r.amountPaid)}</span> },
    {
      id: 'due', header: 'Due', accessor: r => r.amountDue ?? (r.amount - (r.amountPaid || 0)), sortable: true, align: 'right',
      render: r => <span className="font-semibold text-red-600">{formatNaira(r.amountDue ?? (r.amount - (r.amountPaid || 0)))}</span>,
    },
    { id: 'status', header: 'Status', accessor: r => r.status, sortable: true, render: r => <StatusChip status={r.status} /> },
  ], []);

  const filters = useMemo(() => [
    { id: 'status', label: 'Status', getValue: r => r.status, options: Object.keys(INVOICE_STATUS).map(s => ({ value: s, label: s })) },
    { id: 'classId', label: 'Class', getValue: r => r.classId, options: classOptions },
  ], [classOptions]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Total Billed"      value={formatNaira(summary.totalBilled)}      tone="bg-[#E9F2FC]" />
        <SummaryCard label="Total Collected"   value={formatNaira(summary.totalPaid)}        tone="bg-[#FBFADE]" />
        <SummaryCard label="Total Outstanding" value={formatNaira(summary.totalOutstanding)} tone="bg-[#EAFBF0]" />
      </div>

      <WorkbenchTable
        title="Invoices"
        storageKey="fee-invoices"
        rows={invoices}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search student or structure…"
        searchKeys={['studentName', 'feeStructureName', 'studentId']}
        onRowClick={(r) => navigate(`${ROUTES.invoices}/${r.id}`)}
        emptyState={{
          icon: ReceiptText,
          title: 'No invoices yet',
          description: 'Invoices are generated automatically when you publish a fee structure.',
          prerequisite: { label: 'Go to Fee Structures', to: ROUTES.feeStructures },
        }}
      />
    </div>
  );
}
