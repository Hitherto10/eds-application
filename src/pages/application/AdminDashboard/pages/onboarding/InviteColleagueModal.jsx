import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, FlaskConical } from 'lucide-react';
import { inviteColleague } from '../../services/onboardingAPIs.js';
import { pushToast } from '../../../../../components/patterns';

const ROLE_FOR_STEP = {
    fees: 'Bursar', 'payment-gateway': 'Bursar',
    timetable: 'Academic Officer', grading: 'Exam Officer', subjects: 'Academic Officer',
    staff: 'Administrator', students: 'Front Desk',
};

/**
 * InviteColleagueModal — delegate a setup step to a colleague.
 * MOCK: records the invite in localStorage; no email is actually sent yet.
 */
export default function InviteColleagueModal({ step, onClose, onInvited }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(ROLE_FOR_STEP[step?.id] ?? 'Administrator');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const submit = async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Enter a valid email address.');
            return;
        }
        setBusy(true);
        try {
            await inviteColleague({ email: email.trim(), role, stepId: step?.id });
            pushToast({ message: `Invite queued for ${email.trim()} (mock)` });
            onInvited?.();
            onClose();
        } finally {
            setBusy(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-[15px] font-bold text-gray-900">Invite a colleague</h2>
                        <p className="text-[12px] text-gray-400 mt-0.5">Delegate <span className="font-semibold text-gray-600">{step?.title}</span> to a teammate.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100"><X size={16} /></button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                        <FlaskConical size={13} /> Mock — awaiting backend. The invite is saved locally, not emailed yet.
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email</label>
                        <input value={email} onChange={e => { setEmail(e.target.value); setError(null); }} placeholder="colleague@school.edu.ng"
                            className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-200 focus:border-blue-400'}`} />
                        {error && <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>}
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-400 text-sm outline-none bg-white">
                            {['Administrator', 'Bursar', 'Academic Officer', 'Exam Officer', 'Front Desk'].map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2.5 px-5 py-4 bg-gray-50/60 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={submit} disabled={busy} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send invite
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
