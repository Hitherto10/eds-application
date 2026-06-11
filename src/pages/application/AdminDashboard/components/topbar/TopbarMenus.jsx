import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCheck, ClipboardCheck, Circle, CheckCircle2, ChevronRight,
    User, Moon, Sun, LogOut, Settings2, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext.jsx';
import { getTheme, toggleTheme } from '../../../../../utils/theme.js';
import useSetupProgress from '../../hooks/useSetupProgress.js';
import { ROUTES } from '../../navigation/navConfig.js';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../../../../components/ui/alert-dialog';

/* ─── Shared popover behaviour ─────────────────────────────────────────────── */
function usePopover() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    return { open, setOpen, ref };
}

const Panel = ({ children, width = 'w-80' }) => (
    <div className={`absolute right-0 mt-2 ${width} bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150`}>
        {children}
    </div>
);

const PanelHeader = ({ title, sub, action }) => (
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100">
        <div>
            <p className="text-xs font-bold text-gray-900">{title}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {action}
    </div>
);

/* ─── Notification bell ────────────────────────────────────────────────────── */
export function NotificationBell() {
    const { open, setOpen, ref } = usePopover();
    // Notification feed wiring lands with the platform notification engine;
    // until then the bell renders an honest all-caught-up state — never fake items.
    const notifications = [];
    const unread = notifications.filter(n => !n.read).length;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Notifications"
            >
                <Bell size={17} />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                        {unread}
                    </span>
                )}
            </button>

            {open && (
                <Panel>
                    <PanelHeader
                        title="Notifications"
                        sub="Alerts from across your school"
                        action={unread > 0 && (
                            <button className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                    />
                    {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                            <div className="mx-auto w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                                <CheckCheck size={18} className="text-green-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">You're all caught up</p>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                Attendance, payment, and results alerts will land here as those modules go live.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                            {/* notification rows render here once the feed is wired */}
                        </div>
                    )}
                </Panel>
            )}
        </div>
    );
}

/* ─── Approvals chip ───────────────────────────────────────────────────────── */
export function ApprovalsChip() {
    const { open, setOpen, ref } = usePopover();
    // Approval queues (results sign-off, fee waivers, excuse notes) populate this
    // as their workflows ship. Count is real — currently nothing routes here.
    const count = 0;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`hidden md:flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold transition-colors ${
                    count > 0
                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
                title="Items awaiting your approval"
            >
                <ClipboardCheck size={13} className={count > 0 ? 'text-amber-500' : 'text-gray-400'} />
                Approvals
                {count > 0 && (
                    <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                        {count}
                    </span>
                )}
            </button>

            {open && (
                <Panel>
                    <PanelHeader title="Awaiting your approval" sub="Everything that needs your sign-off, in one place" />
                    <div className="px-4 py-10 text-center">
                        <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <ClipboardCheck size={18} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Nothing waiting on you</p>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                            Result sheets, fee waivers, and excuse notes will queue here for sign-off.
                        </p>
                    </div>
                </Panel>
            )}
        </div>
    );
}

/* ─── Setup progress chip ──────────────────────────────────────────────────── */
export function SetupProgressChip() {
    const { open, setOpen, ref } = usePopover();
    const navigate = useNavigate();
    const { loading, steps, percent, complete } = useSetupProgress();

    if (loading || complete) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                title="Finish setting up your school"
            >
                <Sparkles size={13} className="text-blue-500" />
                Setup {percent}%
                <span className="w-14 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                    <span className="block h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </span>
            </button>

            {open && (
                <Panel width="w-[340px]">
                    <PanelHeader
                        title={`School setup — ${percent}% complete`}
                        sub="Each step unlocks part of the platform. Status comes from real data."
                    />
                    <div className="py-1.5">
                        {steps.map(step => (
                            <button
                                key={step.id}
                                onClick={() => { setOpen(false); navigate(step.route); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group"
                            >
                                {step.done
                                    ? <CheckCircle2 size={17} className="text-green-500 shrink-0" />
                                    : <Circle size={17} className="text-gray-300 shrink-0" />}
                                <span className="flex-1 min-w-0">
                                    <span className={`block text-sm font-medium ${step.done ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}`}>
                                        {step.label}
                                    </span>
                                    {!step.done && <span className="block text-[11px] text-gray-400">{step.hint}</span>}
                                </span>
                                {!step.done && <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </Panel>
            )}
        </div>
    );
}

/* ─── Profile menu ─────────────────────────────────────────────────────────── */
export function ProfileMenu() {
    const { open, setOpen, ref } = usePopover();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => getTheme() === 'dark');
    const [confirmLogout, setConfirmLogout] = useState(false);

    const name = user?.fullName || user?.name || 'Administrator';
    const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

    const handleTheme = () => {
        toggleTheme();
        setIsDark(getTheme() === 'dark');
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold hover:ring-4 hover:ring-blue-100 transition-all"
                title={name}
            >
                {initials || 'A'}
            </button>

            {open && (
                <Panel width="w-64">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1.5">
                        <button
                            onClick={() => { setOpen(false); navigate(ROUTES.adminProfile); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <User size={15} className="text-gray-400" /> My profile
                        </button>
                        <button
                            onClick={() => { setOpen(false); navigate(ROUTES.settings); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Settings2 size={15} className="text-gray-400" /> Preferences
                        </button>
                        <button
                            onClick={handleTheme}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {isDark ? <Sun size={15} className="text-gray-400" /> : <Moon size={15} className="text-gray-400" />}
                            {isDark ? 'Light theme' : 'Dark theme'}
                        </button>
                    </div>
                    <div className="py-1.5 border-t border-gray-100">
                        <button
                            onClick={() => { setOpen(false); setConfirmLogout(true); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={15} /> Logout
                        </button>
                    </div>
                </Panel>
            )}

            <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm logout</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to log out of EduConnect?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600" onClick={() => logout()}>Logout</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
