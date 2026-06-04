import apiClient from '../../../../utils/axiosConfig.js';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  FEE & PAYMENT MANAGEMENT ENGINE  —  API SPECIFICATION & STUB LAYER
 * ═════════════════════════════════════════════════════════════════════════════
 *
 *  Base routes derive from newFeatures.md §Fees and are EXTENDED into a robust,
 *  production-grade, ledger-based finance module per feeImplementation.md.
 *
 *  ┌─ DESIGN PRINCIPLES (feeImplementation.md) ───────────────────────────────┐
 *  │  • Ledger-based      — every action is a transaction (debit/credit/adj)  │
 *  │  • Double-entry      — Student Receivable ↔ School Revenue               │
 *  │  • Event-driven      — emits FEE_STRUCTURE_PUBLISHED, BILL_GENERATED,    │
 *  │                        PAYMENT_INITIATED, PAYMENT_CONFIRMED,             │
 *  │                        PAYMENT_FAILED                                    │
 *  │  • Modular layers    — Config · Billing · Payment · Ledger ·             │
 *  │                        Reconciliation · Reporting                       │
 *  │  • 2-phase lifecycle — draft → published (no intermediate review or      │
 *  │                        locked states; publish is visible to parents      │
 *  │                        and students immediately)                         │
 *  └──────────────────────────────────────────────────────────────────────────┘
 *
 *  MONEY: all amounts are stored & transmitted in KOBO (integer). Never floats.
 *         Use formatNaira(kobo) for display only.
 *
 *  FEATURE FLAG: flip FEE_BACKEND_LIVE = true once endpoints are deployed.
 *  Every stub logs its exact METHOD + URL + PAYLOAD + expected RESPONSE so the
 *  backend developer has a precise contract to implement against.
 *
 *  ID NORMALISATION: live backend returns Mongo `_id`; normalizeId() maps it to
 *  `id` so the frontend state shape stays consistent.
 */

export const FEE_BACKEND_LIVE = false;

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ── ID normalisation (live-mode only) ─────────────────────────────────────────
const normalizeId = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const { _id, ...rest } = obj;
  return _id ? { id: _id, _id, ...rest } : obj;
};
const normalizeList = (list) =>
  Array.isArray(list) ? list.map(normalizeId) : list;

// ═════════════════════════════════════════════════════════════════════════════
//  DOMAIN CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

/** Standard Nigerian school fee item types. */
export const FEE_TYPES = [
  { id: 'tuition',      label: 'Tuition',          optional: false },
  { id: 'development',  label: 'Development Levy',  optional: false },
  { id: 'transport',   label: 'Transport',         optional: true  },
  { id: 'boarding',    label: 'Boarding',          optional: true  },
  { id: 'uniform',     label: 'Uniform',           optional: true  },
  { id: 'books',       label: 'Books / Materials', optional: true  },
  { id: 'exam',        label: 'Examination',       optional: false },
  { id: 'pta',         label: 'PTA Levy',          optional: false },
  { id: 'miscellaneous', label: 'Miscellaneous',   optional: true  },
];

/**
 * Fee structure lifecycle — 2 phases only: draft → published.
 *
 * • draft     — created, editable, not visible to parents/students.
 * • published — visible on parent and student dashboards; no further edits allowed.
 *
 * A published structure can be reverted to draft by an admin if corrections are needed
 * (revert_draft action on the transition endpoint), but this is not surfaced in the UI
 * to prevent accidental changes after parents have seen the fee structure.
 */
export const STRUCTURE_STATUS = {
  draft:     { label: 'Draft',     style: 'bg-gray-100 text-gray-600 border border-gray-200',     next: 'published' },
  published: { label: 'Published', style: 'bg-green-50 text-green-700 border border-green-200',    next: null        },
};

/** Invoice (bill) lifecycle. */
export const INVOICE_STATUS = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  partial:  'bg-blue-50 text-blue-700 border border-blue-200',
  paid:     'bg-green-50 text-green-700 border border-green-200',
  overdue:  'bg-red-50 text-red-700 border border-red-200',
  void:     'bg-gray-100 text-gray-500 border border-gray-200',
};

/** Manual + gateway payment channels. */
export const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash',           kind: 'manual'  },
  { id: 'bank_transfer', label: 'Bank Transfer',  kind: 'manual'  },
  { id: 'pos',           label: 'POS',            kind: 'manual'  },
  { id: 'cheque',        label: 'Cheque',         kind: 'manual'  },
  { id: 'paystack',      label: 'Paystack',       kind: 'gateway' },
  { id: 'flutterwave',   label: 'Flutterwave',    kind: 'gateway' },
];

/** Ledger entry kinds (double-entry). */
export const LEDGER_ENTRY_TYPES = {
  debit:      'Debit (Bill)',
  credit:     'Credit (Payment)',
  adjustment: 'Adjustment',
};

/** Adjustment categories. */
export const ADJUSTMENT_TYPES = [
  { id: 'discount',    label: 'Discount'    },
  { id: 'waiver',      label: 'Waiver'      },
  { id: 'scholarship', label: 'Scholarship' },
  { id: 'correction',  label: 'Correction'  },
];

/** Domain events emitted by the backend (documented for the integrator). */
export const FEE_EVENTS = [
  'FEE_STRUCTURE_PUBLISHED',
  'BILL_GENERATED',
  'PAYMENT_INITIATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_FAILED',
  'ADJUSTMENT_APPLIED',
  'INVOICE_VOIDED',
];

// ═════════════════════════════════════════════════════════════════════════════
//  MONEY HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/** Format kobo (integer) → ₦ display string. */
export function formatNaira(kobo = 0) {
  const naira = (Number(kobo) || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(naira);
}

/** Convert a Naira input (number/string) → kobo integer for transmission. */
export function toKobo(naira) {
  return Math.round((Number(naira) || 0) * 100);
}

/** Sum a fee structure's items → total kobo. */
export function sumItems(items = []) {
  return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
}

// ── Mock id helper ────────────────────────────────────────────────────────────
let _seq = 0;
const mockId = (prefix) => `${prefix}_${Date.now().toString(36)}_${_seq++}`;

// ═════════════════════════════════════════════════════════════════════════════
//  A. FEE CONFIGURATION LAYER
//     POST/GET/PUT/DELETE /api/fees/structures (+ clone, transition, versions)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/fees/structures
 * Query: ?academicYearId=&termId=&classId=&status=
 */
export async function getFeeStructures(filters = {}) {
  console.log('📡 GET /api/fees/structures', { params: filters });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      feeStructures: [{
        _id: 'fs_001',
        schoolId: 'SUN8935',
        academicYearId: 'year_2025',
        termId: 'term_1',
        classId: 'class_10',
        className: 'JSS1',
        name: 'JSS1 First Term Fees',
        items: [
          { feeType: 'tuition',     name: 'Tuition',          amount: 5000000, optional: false },
          { feeType: 'development', name: 'Development Levy',  amount: 1000000, optional: false },
          { feeType: 'transport',  name: 'Transport',         amount: 1500000, optional: true  },
        ],
        totalAmount: 7500000,
        dueDate: '2026-01-15',
        paymentType: 'installment',
        installmentPlans: [
          { label: '1st Installment', percentage: 50, dueDate: '2026-01-15' },
          { label: '2nd Installment', percentage: 50, dueDate: '2026-03-01' },
        ],
        status: 'published',
        version: 2,
        isLocked: false,
        createdAt: 'ISO', updatedAt: 'ISO',
      }],
      total: 1,
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/structures', { params: filters });
    if (data.success) data.data.feeStructures = normalizeList(data.data.feeStructures);
    return data;
  }

  await delay();
  return { success: true, data: { feeStructures: [], total: 0 } };
}

/**
 * GET /api/fees/structures/:id
 */
export async function getFeeStructureById(structureId) {
  console.log(`📡 GET /api/fees/structures/${structureId}`);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/structures/${structureId}`);
    if (data.success) data.data = normalizeId(data.data.feeStructure || data.data);
    return data;
  }
  await delay();
  return { success: true, data: { feeStructure: null } };
}

/**
 * POST /api/fees/structures
 * Creates a DRAFT fee structure (multi-item, optional installment plans).
 *
 * Payload:
 * {
 *   academicYearId, termId, classId, className,
 *   name: "JSS1 First Term Fees",
 *   items: [{ feeType, name, amount(kobo), optional, conditional? }],
 *   dueDate: "2026-01-15",
 *   paymentType: "one-time | installment",
 *   installmentPlans?: [{ label, percentage, dueDate }]
 * }
 * Response (201): { success, message, data: { feeStructure } }
 */
export async function createFeeStructure(payload) {
  console.log('📡 POST /api/fees/structures', payload);
  console.log('📦 Expected response (201):', {
    success: true,
    message: 'Fee structure created successfully',
    data: { feeStructure: { _id: 'fs_xxx', status: 'draft', version: 1 } },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/fees/structures', payload);
    if (data.success) data.data.feeStructure = normalizeId(data.data.feeStructure);
    return data;
  }

  await delay(700);
  const id = mockId('fs');
  const feeStructure = {
    id, _id: id,
    ...payload,
    totalAmount: sumItems(payload.items),
    status: 'draft',
    version: 1,
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { success: true, message: 'Fee structure created successfully', data: { feeStructure } };
}

/**
 * PUT /api/fees/structures/:id
 * Editable only while status = 'draft'. Attempting to edit a published structure
 * should be rejected by the backend with a 409 Conflict response.
 * Each successful edit increments `version` (version control).
 *
 * Backend rule: reject (409) if status is 'published'.
 */
export async function updateFeeStructure(structureId, payload) {
  console.log(`📡 PUT /api/fees/structures/${structureId}`, payload);
  console.log('📦 Backend rule: reject (409) if status is published/locked.');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.put(`/api/fees/structures/${structureId}`, payload);
    if (data.success) data.data.feeStructure = normalizeId(data.data.feeStructure);
    return data;
  }

  await delay();
  return {
    success: true,
    message: 'Fee structure updated successfully',
    data: {
      feeStructure: {
        id: structureId, _id: structureId,
        ...payload,
        totalAmount: sumItems(payload.items),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

/**
 * DELETE /api/fees/structures/:id
 * Backend rule: only DRAFT structures are deletable; published with invoices → 409.
 */
export async function deleteFeeStructure(structureId) {
  console.log(`📡 DELETE /api/fees/structures/${structureId}`);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.delete(`/api/fees/structures/${structureId}`);
    return data;
  }
  await delay();
  return { success: true, message: 'Fee structure deleted successfully' };
}

/**
 * POST /api/fees/structures/:id/clone
 * Clones a structure into a new term/year (Advanced Capability: "Clone previous term fees").
 * Payload: { targetAcademicYearId, targetTermId, targetClassIds?: [] }
 * Response: { success, data: { feeStructures: [...] } }  // one per target class
 */
export async function cloneFeeStructure(structureId, payload) {
  console.log(`📡 POST /api/fees/structures/${structureId}/clone`, payload);
  console.log('📦 Effect: deep-copies items/installments into a fresh DRAFT.');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/fees/structures/${structureId}/clone`, payload);
    if (data.success) data.data.feeStructures = normalizeList(data.data.feeStructures);
    return data;
  }

  await delay(600);
  return {
    success: true,
    message: 'Fee structure cloned successfully',
    data: { feeStructures: [] },
  };
}

/**
 * POST /api/fees/structures/:id/transition
 * Drives the 2-phase lifecycle: draft → published.
 *
 * Supported actions:
 * • 'publish'       — moves draft → published. Backend MUST:
 *                     1. Emit FEE_STRUCTURE_PUBLISHED.
 *                     2. Prevent further structural edits.
 *                     3. Optionally auto-generate invoices server-side via the
 *                        FEE_STRUCTURE_PUBLISHED event handler (the frontend
 *                        also calls generateInvoicesForClass immediately after
 *                        this endpoint returns, so idempotency is essential).
 *                     Parents and students see the fee structure on their
 *                     dashboards as soon as this transitions to 'published'.
 * • 'revert_draft'  — emergency revert published → draft (admin-only; use with
 *                     care; not exposed in the UI to avoid confusion after
 *                     parents have already seen it).
 *
 * Payload: { action: 'publish' | 'revert_draft' }
 * Response: { success, message, data: { feeStructure: { id, status } } }
 */
export async function transitionFeeStructure(structureId, action) {
  console.log(`📡 POST /api/fees/structures/${structureId}/transition`, { action });
  console.log('📦 Valid actions: publish | revert_draft');
  console.log('📦 Emits: FEE_STRUCTURE_PUBLISHED when action = "publish".');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/fees/structures/${structureId}/transition`, { action });
    if (data.success) data.data.feeStructure = normalizeId(data.data.feeStructure);
    return data;
  }

  await delay(500);
  // Only two valid transitions in the 2-phase lifecycle.
  const actionToStatus = { publish: 'published', revert_draft: 'draft' };
  const nextStatus = actionToStatus[action];

  if (!nextStatus) {
    return {
      success: false,
      message: `Unknown transition action "${action}". Valid actions: publish, revert_draft.`,
    };
  }

  return {
    success: true,
    message: action === 'publish'
      ? 'Fee structure published — parents and students can now see it on their dashboards.'
      : 'Fee structure reverted to draft.',
    data: { feeStructure: { id: structureId, status: nextStatus } },
  };
}

/**
 * GET /api/fees/structures/:id/versions
 * Returns the immutable change-history (version control / audit trail).
 */
export async function getFeeStructureVersions(structureId) {
  console.log(`📡 GET /api/fees/structures/${structureId}/versions`);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/structures/${structureId}/versions`);
    return data;
  }
  await delay();
  return { success: true, data: { versions: [], total: 0 } };
}

// ═════════════════════════════════════════════════════════════════════════════
//  B. BILLING LAYER  —  INVOICES (bills)
//     /api/fees/invoices  (+ generate, void, student fees)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/fees/invoices
 * Query: ?classId=&status=&studentId=&academicYearId=&termId=&search=&page=&limit=
 * Response includes a roll-up `summary` for the toolbar KPIs.
 */
export async function getInvoices(filters = {}) {
  console.log('📡 GET /api/fees/invoices', { params: filters });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      invoices: [{
        _id: 'inv_001',
        studentId: 'stu_1', studentName: 'John Doe',
        className: 'JSS1', classId: 'class_10',
        feeStructureId: 'fs_001', feeStructureName: 'JSS1 First Term Fees',
        amount: 7500000, amountPaid: 2500000, amountDue: 5000000,
        status: 'partial', dueDate: '2026-01-15',
        createdAt: 'ISO',
      }],
      total: 50,
      summary: { totalBilled: 250000000, totalPaid: 150000000, totalOutstanding: 100000000 },
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/invoices', { params: filters });
    if (data.success) data.data.invoices = normalizeList(data.data.invoices);
    return data;
  }

  await delay();
  return {
    success: true,
    data: { invoices: [], total: 0, summary: { totalBilled: 0, totalPaid: 0, totalOutstanding: 0 } },
  };
}

/**
 * POST /api/fees/invoices
 * Unified bulk creation (newFeatures.md base).
 * Payload: { invoices: [{ feeStructureId, studentId }] }
 * Emits BILL_GENERATED per invoice. Creates a DEBIT ledger entry per invoice.
 */
export async function createInvoices(payload) {
  console.log('📡 POST /api/fees/invoices', payload);
  console.log('📦 Emits BILL_GENERATED + posts ledger DEBIT (Student Receivable).');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/fees/invoices', payload);
    if (data.success) data.data.invoices = normalizeList(data.data.invoices);
    return data;
  }

  await delay(800);
  const invoices = (payload.invoices || []).map((inv) => {
    const id = mockId('inv');
    return {
      id, _id: id,
      ...inv,
      amount: 0, amountPaid: 0, amountDue: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  });
  return {
    success: true,
    message: `${invoices.length} invoice(s) created successfully`,
    data: { invoices, total: invoices.length, errors: [] },
  };
}

/**
 * POST /api/fees/invoices/generate
 * Bulk invoice generation for an entire class from a published fee structure.
 * Backend resolves the student roster server-side — no need to send individual IDs.
 *
 * This is called AUTOMATICALLY by the frontend immediately after a fee structure
 * is published (see FeeStructuresTab → handleConfirmPublish). It is also safe to
 * call from the FEE_STRUCTURE_PUBLISHED backend event handler for server-side
 * generation. The endpoint MUST be idempotent — students already billed should
 * be skipped rather than double-billed.
 *
 * Payload: { feeStructureId, classId, armId?, includeOptional?: string[] }
 * Response: { success, message, data: { generated, skipped, invoices:[] } }
 */
export async function generateInvoicesForClass(payload) {
  console.log('📡 POST /api/fees/invoices/generate', payload);
  console.log('📦 Resolves roster server-side; idempotent (skips existing).');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/fees/invoices/generate', payload);
    if (data.success) data.data.invoices = normalizeList(data.data.invoices);
    return data;
  }

  await delay(900);
  return {
    success: true,
    message: 'Invoices generated for class',
    data: { generated: 0, skipped: 0, invoices: [] },
  };
}

/**
 * GET /api/fees/invoices/:id
 */
export async function getInvoiceById(invoiceId) {
  console.log(`📡 GET /api/fees/invoices/${invoiceId}`);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/invoices/${invoiceId}`);
    if (data.success) data.data = normalizeId(data.data.invoice || data.data);
    return data;
  }
  await delay();
  return { success: true, data: { invoice: null } };
}

/**
 * POST /api/fees/invoices/:id/void
 * Soft-cancels an invoice. Posts a reversing ledger entry (never hard-delete).
 * Payload: { reason }
 */
export async function voidInvoice(invoiceId, reason) {
  console.log(`📡 POST /api/fees/invoices/${invoiceId}/void`, { reason });
  console.log('📦 Emits INVOICE_VOIDED + reversing ledger entry.');
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/fees/invoices/${invoiceId}/void`, { reason });
    return data;
  }
  await delay();
  return { success: true, message: 'Invoice voided successfully' };
}

/**
 * GET /api/fees/student/:studentId   (newFeatures.md base)
 * Full fee position for one student (all invoices + computed balance).
 */
export async function getStudentFees(studentId) {
  console.log(`📡 GET /api/fees/student/${studentId}`);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      student: { id: studentId, name: 'John Doe', className: 'JSS1' },
      invoices: [{ feeStructureName: 'JSS1 First Term', amount: 7500000, amountPaid: 0, status: 'pending' }],
      totals: { billed: 7500000, paid: 0, outstanding: 7500000 },
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/student/${studentId}`);
    return data;
  }

  await delay();
  return {
    success: true,
    data: {
      student: { id: studentId },
      invoices: [],
      totals: { billed: 0, paid: 0, outstanding: 0 },
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  C. PAYMENT LAYER  —  manual record + gateway init/verify
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/fees/invoices/:invoiceId/payment   (newFeatures.md base)
 * MANUAL payment recording (cash / bank_transfer / pos / cheque).
 * Posts a CREDIT ledger entry, recomputes invoice status (partial vs paid),
 * emits PAYMENT_CONFIRMED, returns a receipt stub.
 *
 * Payload: { amount(kobo), paymentMethod, referenceNumber, receiptNumber?, note?, paidAt? }
 */
export async function recordPayment(invoiceId, payload) {
  console.log(`📡 POST /api/fees/invoices/${invoiceId}/payment`, payload);
  console.log('📦 Emits PAYMENT_CONFIRMED + ledger CREDIT. Returns receipt.');
  console.log('📦 Expected response:', {
    success: true,
    message: 'Payment recorded successfully',
    data: {
      payment: { id: 'pay_x', amount: 2500000, method: 'cash', receiptNumber: 'RCP-0001' },
      invoice: { status: 'partial', amountPaid: 2500000, amountDue: 5000000 },
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/fees/invoices/${invoiceId}/payment`, payload);
    return data;
  }

  await delay(700);
  const payId = mockId('pay');
  return {
    success: true,
    message: 'Payment recorded successfully',
    data: {
      payment: {
        id: payId, _id: payId,
        invoiceId,
        amount: payload.amount,
        method: payload.paymentMethod,
        referenceNumber: payload.referenceNumber,
        receiptNumber: payload.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
        paidAt: payload.paidAt || new Date().toISOString(),
        status: 'confirmed',
      },
      invoice: { id: invoiceId, status: 'partial' },
    },
  };
}

/**
 * POST /api/fees/invoices/:invoiceId/payment/initialize   (GATEWAY)
 * Starts an online payment with Paystack / Flutterwave.
 * Emits PAYMENT_INITIATED. Returns a hosted checkout URL + reference.
 *
 * Payload: { gateway: 'paystack' | 'flutterwave', amount(kobo), email, callbackUrl }
 * Response: { success, data: { authorizationUrl, reference, accessCode } }
 */
export async function initializePayment(invoiceId, payload) {
  console.log(`📡 POST /api/fees/invoices/${invoiceId}/payment/initialize`, payload);
  console.log('📦 Emits PAYMENT_INITIATED. Returns gateway authorizationUrl.');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post(
      `/api/fees/invoices/${invoiceId}/payment/initialize`, payload
    );
    return data;
  }

  await delay(800);
  const reference = `${payload.gateway || 'psk'}_${mockId('ref')}`;
  return {
    success: true,
    message: 'Payment initialized',
    data: {
      authorizationUrl: `https://checkout.${payload.gateway || 'paystack'}.com/${reference}`,
      reference,
      accessCode: mockId('ac'),
      gateway: payload.gateway,
    },
  };
}

/**
 * POST /api/fees/payments/verify   (GATEWAY CALLBACK)
 * Verifies a gateway transaction by reference (server-to-server confirm).
 * On success → posts CREDIT ledger entry, emits PAYMENT_CONFIRMED.
 * On failure → emits PAYMENT_FAILED.
 *
 * Payload: { reference, gateway }
 */
export async function verifyPayment(payload) {
  console.log('📡 POST /api/fees/payments/verify', payload);
  console.log('📦 Emits PAYMENT_CONFIRMED | PAYMENT_FAILED.');

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/fees/payments/verify', payload);
    return data;
  }

  await delay(900);
  return {
    success: true,
    message: 'Payment verified',
    data: {
      status: 'confirmed',
      payment: { reference: payload.reference, gateway: payload.gateway, amount: 0 },
    },
  };
}

/**
 * GET /api/fees/invoices/:invoiceId/payments   (newFeatures.md base)
 * Payment history for one invoice.
 */
export async function getPaymentHistory(invoiceId) {
  console.log(`📡 GET /api/fees/invoices/${invoiceId}/payments`);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/invoices/${invoiceId}/payments`);
    if (data.success) data.data.payments = normalizeList(data.data.payments);
    return data;
  }
  await delay();
  return { success: true, data: { payments: [], totalPaid: 0 } };
}

/**
 * GET /api/fees/payments   (ROBUST EXTENSION)
 * School-wide payment feed for reconciliation / cashbook.
 * Query: ?from=&to=&method=&gateway=&status=&page=&limit=
 */
export async function getAllPayments(filters = {}) {
  console.log('📡 GET /api/fees/payments', { params: filters });
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/payments', { params: filters });
    if (data.success) data.data.payments = normalizeList(data.data.payments);
    return data;
  }
  await delay();
  return { success: true, data: { payments: [], total: 0 } };
}

// ═════════════════════════════════════════════════════════════════════════════
//  D. ADJUSTMENTS  —  discounts / waivers / scholarships / corrections
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/fees/adjustments
 * Posts an ADJUSTMENT ledger entry against a student/invoice.
 * Payload: { studentId, invoiceId?, type, amount(kobo), reason, approvedBy }
 */
export async function applyAdjustment(payload) {
  console.log('📡 POST /api/fees/adjustments', payload);
  console.log('📦 Emits ADJUSTMENT_APPLIED + ledger ADJUSTMENT entry.');
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/fees/adjustments', payload);
    return data;
  }
  await delay(600);
  const id = mockId('adj');
  return {
    success: true,
    message: 'Adjustment applied successfully',
    data: { adjustment: { id, _id: id, ...payload, createdAt: new Date().toISOString() } },
  };
}

/**
 * GET /api/fees/adjustments
 * Query: ?studentId=&type=&from=&to=
 */
export async function getAdjustments(filters = {}) {
  console.log('📡 GET /api/fees/adjustments', { params: filters });
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/adjustments', { params: filters });
    if (data.success) data.data.adjustments = normalizeList(data.data.adjustments);
    return data;
  }
  await delay();
  return { success: true, data: { adjustments: [], total: 0 } };
}

// ═════════════════════════════════════════════════════════════════════════════
//  E. LEDGER LAYER  —  double-entry transaction trail
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/fees/ledger/student/:studentId
 * Chronological transaction trail with running balance.
 * Query: ?academicYearId=&termId=
 *
 * Each row: { date, type: debit|credit|adjustment, description, debit, credit,
 *             balance, reference, account }  // account = receivable | revenue
 */
export async function getStudentLedger(studentId, filters = {}) {
  console.log(`📡 GET /api/fees/ledger/student/${studentId}`, { params: filters });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      student: { id: studentId, name: 'John Doe' },
      entries: [
        { date: 'ISO', type: 'debit',  description: 'JSS1 First Term Fees', debit: 7500000, credit: 0, balance: 7500000, account: 'receivable' },
        { date: 'ISO', type: 'credit', description: 'Cash payment RCP-0001', debit: 0, credit: 2500000, balance: 5000000, account: 'receivable' },
      ],
      openingBalance: 0,
      closingBalance: 5000000,
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/ledger/student/${studentId}`, { params: filters });
    return data;
  }

  await delay();
  return {
    success: true,
    data: { student: { id: studentId }, entries: [], openingBalance: 0, closingBalance: 0 },
  };
}

/**
 * GET /api/fees/ledger/summary
 * School-level double-entry trial balance roll-up.
 * Query: ?academicYearId=&termId=
 */
export async function getLedgerSummary(filters = {}) {
  console.log('📡 GET /api/fees/ledger/summary', { params: filters });
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/ledger/summary', { params: filters });
    return data;
  }
  await delay();
  return {
    success: true,
    data: {
      totalReceivable: 0, totalRevenue: 0, totalCollected: 0,
      totalAdjustments: 0, totalOutstanding: 0,
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  F. RECEIPTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/fees/receipts/:paymentId
 * Returns a render-ready digital receipt document.
 */
export async function getReceipt(paymentId) {
  console.log(`📡 GET /api/fees/receipts/${paymentId}`);
  console.log('📦 Expected response:', {
    success: true,
    data: {
      receipt: {
        receiptNumber: 'RCP-0001',
        paymentId,
        school: { name: '', logoUrl: '', address: '' },
        student: { name: '', className: '' },
        items: [{ name: 'Tuition', amount: 5000000 }],
        amountPaid: 2500000, balance: 5000000,
        method: 'cash', reference: 'TXN123', paidAt: 'ISO',
        issuedBy: 'Bursar',
      },
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get(`/api/fees/receipts/${paymentId}`);
    return data;
  }
  await delay();
  return { success: true, data: { receipt: null } };
}

/**
 * POST /api/fees/receipts/:paymentId/send
 * Emails / SMS the receipt to the parent.
 * Payload: { channel: 'email' | 'sms', to }
 */
export async function sendReceipt(paymentId, payload) {
  console.log(`📡 POST /api/fees/receipts/${paymentId}/send`, payload);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post(`/api/fees/receipts/${paymentId}/send`, payload);
    return data;
  }
  await delay(500);
  return { success: true, message: 'Receipt dispatched' };
}

// ═════════════════════════════════════════════════════════════════════════════
//  G. REPORTING LAYER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/fees/analytics   (newFeatures.md base)
 * Query: ?classId=&academicYearId=&termId=
 */
export async function getFeeAnalytics(filters = {}) {
  console.log('📡 GET /api/fees/analytics', { params: filters });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      totalExpected: 500000000,
      totalCollected: 350000000,
      totalPending: 150000000,
      collectionRate: 70.0,
      studentsBilled: 240, studentsFullyPaid: 150, studentsOwing: 90,
      byClass: [{ classId: 'c1', className: 'JSS1', expected: 100000000, collected: 80000000 }],
      byMethod: [{ method: 'paystack', total: 120000000 }, { method: 'cash', total: 90000000 }],
      monthlyTrend: [{ month: '2025-09', collected: 50000000 }],
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/analytics', { params: filters });
    return data;
  }

  await delay();
  return {
    success: true,
    data: {
      totalExpected: 0, totalCollected: 0, totalPending: 0, collectionRate: 0,
      studentsBilled: 0, studentsFullyPaid: 0, studentsOwing: 0,
      byClass: [], byMethod: [], monthlyTrend: [],
    },
  };
}

/**
 * GET /api/fees/reports/outstanding   (ROBUST EXTENSION)
 * Outstanding balance per student (the poster's "outstanding balances report").
 * Query: ?classId=&armId=&threshold=&academicYearId=&termId=&page=&limit=
 */
export async function getOutstandingBalances(filters = {}) {
  console.log('📡 GET /api/fees/reports/outstanding', { params: filters });
  console.log('📦 Expected response:', {
    success: true,
    data: {
      students: [{
        studentId: 'stu_1', studentName: 'John Doe', className: 'JSS1',
        billed: 7500000, paid: 2500000, outstanding: 5000000,
        oldestDueDate: '2026-01-15', daysOverdue: 12,
      }],
      total: 90,
      totals: { billed: 0, paid: 0, outstanding: 0 },
    },
  });

  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/reports/outstanding', { params: filters });
    return data;
  }

  await delay();
  return { success: true, data: { students: [], total: 0, totals: { billed: 0, paid: 0, outstanding: 0 } } };
}

/**
 * GET /api/fees/reports/aging   (ROBUST EXTENSION)
 * Aging buckets of arrears (0-30 / 31-60 / 61-90 / 90+ days).
 */
export async function getAgingReport(filters = {}) {
  console.log('📡 GET /api/fees/reports/aging', { params: filters });
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/reports/aging', { params: filters });
    return data;
  }
  await delay();
  return {
    success: true,
    data: {
      buckets: [
        { range: '0-30',  label: 'Current',   amount: 0, count: 0 },
        { range: '31-60', label: '31-60 days', amount: 0, count: 0 },
        { range: '61-90', label: '61-90 days', amount: 0, count: 0 },
        { range: '90+',   label: '90+ days',   amount: 0, count: 0 },
      ],
    },
  };
}

/**
 * GET /api/fees/reports/collections   (ROBUST EXTENSION)
 * Collection performance over a date range (for charts / export).
 */
export async function getCollectionReport(filters = {}) {
  console.log('📡 GET /api/fees/reports/collections', { params: filters });
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/reports/collections', { params: filters });
    return data;
  }
  await delay();
  return { success: true, data: { series: [], totalCollected: 0 } };
}

// ═════════════════════════════════════════════════════════════════════════════
//  H. RECONCILIATION LAYER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/fees/reconciliation
 * Gateway settlement vs recorded payments (flags mismatches).
 * Query: ?gateway=&from=&to=&status=matched|unmatched
 */
export async function getReconciliation(filters = {}) {
  console.log('📡 GET /api/fees/reconciliation', { params: filters });
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.get('/api/fees/reconciliation', { params: filters });
    return data;
  }
  await delay();
  return { success: true, data: { rows: [], summary: { matched: 0, unmatched: 0 } } };
}

/**
 * POST /api/fees/reconciliation/match
 * Manually links a gateway settlement line to a recorded payment.
 * Payload: { settlementId, paymentId }
 */
export async function reconcileTransaction(payload) {
  console.log('📡 POST /api/fees/reconciliation/match', payload);
  if (FEE_BACKEND_LIVE) {
    const { data } = await apiClient.post('/api/fees/reconciliation/match', payload);
    return data;
  }
  await delay();
  return { success: true, message: 'Transaction reconciled' };
}
