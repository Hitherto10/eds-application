import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    School,
    Users,
    X,
    GraduationCap,
    CalendarDays,
    BookOpen,
    Layers,
    LayoutGrid,
    ChevronDown,
    Wallet,
    FileStack,
    ReceiptText,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    CalendarCheck2,
    CalendarClock, Settings,
} from 'lucide-react';
import { Header } from '../../../dashboardUtilities.jsx';
import { useAuth } from '../../../../../contexts/AuthContext.jsx';
import { Images } from '../../../../../components/images.jsx';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../../../../../components/ui/alert-dialog';

// ─── Nav definition ───────────────────────────────────────────────────────────
const navItems = [
    { name: 'Dashboard',       icon: LayoutDashboard, link: '/dashboard/admin',               children: [] },
    {
        name: 'User Management',
        icon: Users,
        link: '/dashboard/admin/users',
        children: [
            { name: 'Teachers', icon: 'Users', link: '/dashboard/admin/users/teachers' },
            { name: 'Parents',  icon: 'Users', link: '/dashboard/admin/users/parents' },
            { name: 'Students', icon: 'GraduationCap', link: '/dashboard/admin/users/students' },
        ]
    },
    {
        name: 'Fees & Payments',
        icon: Wallet,
        link: '/dashboard/admin/fees',
        children: [
            { name: 'Overview',           icon: 'LayoutDashboard', link: '/dashboard/admin/fees/overview'    },
            { name: 'Fee Structures',     icon: 'FileStack',       link: '/dashboard/admin/fees/structures'  },
            { name: 'Invoices',           icon: 'ReceiptText',     link: '/dashboard/admin/fees/invoices'    },
            { name: 'Payments & Ledger',  icon: 'Wallet',          link: '/dashboard/admin/fees/payments'    },
            { name: 'Reports',            icon: 'BarChart3',       link: '/dashboard/admin/fees/reports'     },
        ],
    },
    { name: 'Timetable Library', icon: CalendarCheck2,  link: '/dashboard/admin/timetable-library' },
    { name: 'Events Planner',  icon: CalendarClock,          link: '/dashboard/admin/events-planner', children: [] },
    {
        name: 'Configuration',
        icon: Settings,
        link: '/dashboard/admin/config',
        children: [
            { name: 'Subject Setup',     icon: 'BookOpen',    link: '/dashboard/admin/config/subjects'  },
            { name: 'Class Setup',       icon: 'Layers',      link: '/dashboard/admin/config/classes'   },
            { name: 'Calendar Settings', icon: 'CalendarDays',link: '/dashboard/admin/config/calendar'  },
            { name: 'Timetable Builder', icon: 'LayoutGrid',  link: '/dashboard/admin/config/timetable' },
        ],
    },
    { name: 'School Profile',  icon: School,          link: '/dashboard/admin/school-profile', children: [] },

];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const Sidebar = () => {
    const location = useLocation();
    const navigate  = useNavigate();
    const { logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    });

    // Which accordion parents are open — auto-open if current route is a child
    const [openItems, setOpenItems] = useState(() => {
        const initial = {};
        navItems.forEach(item => {
            if (item.children?.length && location.pathname.startsWith(item.link)) {
                initial[item.name] = true;
            }
        });
        return initial;
    });

    useEffect(() => {
        localStorage.setItem('admin-sidebar-collapsed', isSidebarCollapsed);
    }, [isSidebarCollapsed]);

    useEffect(() => { setMobileOpen(false); }, [location]);

    // Keep accordion open when navigating between children
    useEffect(() => {
        navItems.forEach(item => {
            if (item.children?.length && location.pathname.startsWith(item.link)) {
                setOpenItems(prev => ({ ...prev, [item.name]: true }));
            }
        });
    }, [location.pathname]);

    useEffect(() => {
        const update = () => setIsDark(document.documentElement.dataset.theme === 'dark');
        update();
        window.addEventListener('themeChange', update);
        return () => window.removeEventListener('themeChange', update);
    }, []);

    const logoSrc = isDark ? Images.main_logo_light : Images.main_logo;

    const toggleItem = (name) =>
        setOpenItems(prev => ({ ...prev, [name]: !prev[name] }));

    const handleLogout = async () => { await logout(); };

    // ── Nav list ──────────────────────────────────────────────────────────────
    const NavContent = ({ onNavigate }) => (
        <nav className="space-y-0.5">
            {navItems.map(item => {
                const hasChildren   = item.children?.length > 0;
                const isOpen        = openItems[item.name] || false;
                const isParentActive = hasChildren
                    ? location.pathname.startsWith(item.link)
                    : item.name === 'Dashboard'
                        ? location.pathname === item.link
                        : location.pathname.startsWith(item.link);

                return (
                    <div key={item.name}>
                        {/* Parent row */}
                        <button
                            onClick={() => {
                                if (hasChildren) {
                                    if (isSidebarCollapsed && !onNavigate) {
                                        setIsSidebarCollapsed(false);
                                        setOpenItems(prev => ({ ...prev, [item.name]: true }));
                                    } else {
                                        toggleItem(item.name);
                                    }
                                } else {
                                    onNavigate?.();
                                    navigate(item.link);
                                }
                            }}
                            className={`w-full flex items-center ${isSidebarCollapsed && !onNavigate ? 'justify-center px-1' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm transition-all duration-150
                                ${isParentActive && !hasChildren
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : isParentActive && hasChildren
                                    ? 'text-gray-900 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                            title={isSidebarCollapsed && !onNavigate ? item.name : undefined}
                        >
                            <item.icon className="w-[18px] h-[18px] shrink-0" />
                            {(!isSidebarCollapsed || onNavigate) && <span className="flex-1 text-left">{item.name}</span>}
                            {(!isSidebarCollapsed || onNavigate) && hasChildren && (
                                <ChevronDown
                                    className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                                        isOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            )}
                        </button>

                        {/* Children — slide open/close */}
                        {hasChildren && (!isSidebarCollapsed || onNavigate) && (
                            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                                <div className="ml-5 border-l mt-0.5 mb-1 pl-3 space-y-0.5">
                                    {item.children.map(child => (
                                        <NavLink
                                            key={child.link}
                                            to={child.link}
                                            onClick={onNavigate}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                                }`
                                            }
                                        >
                                            {/*<child.icon className="w-4 h-4 shrink-0" />*/}
                                            {child.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );

    // ── Logout ──
    const LogoutButton = () => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button className={`flex items-center ${isSidebarCollapsed && !mobileOpen ? 'justify-center px-1' : 'gap-3 px-3'} w-full py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-150`}>
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    {(!isSidebarCollapsed || mobileOpen) && <span>Logout</span>}
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600" onClick={handleLogout}>
                        Logout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // ── Shared shell ──
    const SidebarShell = ({ onNavigate }) => (
        <div className="flex flex-col h-full">
            <div className={`flex items-center h-16 border-b border-gray-200 shrink-0 ${isSidebarCollapsed && !onNavigate ? 'justify-center px-2' : 'justify-between px-6'}`}>
                {(!isSidebarCollapsed || onNavigate) ? (
                    <img src={logoSrc} alt="Logo" className="w-32 transition-opacity duration-300" />
                ) : (
                    <img src={`${Images.logo}`} alt="Logo" className="w-8 transition-opacity duration-300" />
                )}
                {!onNavigate && (
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
                {(!isSidebarCollapsed || onNavigate) ? (
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                        Menu
                    </p>
                ) : (
                    <div className="border-t border-gray-100 my-2 mx-1" />
                )}
                <NavContent onNavigate={onNavigate} />
            </div>
            <div className="shrink-0 px-3 py-4 border-t border-gray-200">
                <LogoutButton />
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger */}
            {!mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-sm border border-gray-200"
                >
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>
            )}

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div className={`
                lg:hidden fixed inset-y-0 left-0 z-50 w-64
                bg-white border-r border-gray-200
                transition-transform duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarShell onNavigate={() => setMobileOpen(false)} />
            </div>

            {/* Desktop sidebar — sticky, part of flex layout, no fixed positioning */}
            <div className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
                <SidebarShell />
            </div>
        </>
    );
};

// ─── AdminLayout ──────────────────────────────────────────────────────────────
const AdminLayout = ({ children, className }) => {
    const location  = useLocation();
    const ICON_RAIL = 72; // px — matches collapsed sidebar width
    const FULL_NAV  = 256;

    // Detect if we're inside a sec_bar section
    const activeNavItem = navItems.find(item => item.sec_bar?.length > 0 && location.pathname.startsWith(item.link));
    const isCollapsed   = Boolean(activeNavItem);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header/>
                <main className={`flex-1 p-2 md:p-4 ${className} justify-center`}>
                    {children}
                </main>
            </div>
        </div>


    );
};

export default AdminLayout;