import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    School,
    Users,
    X,
    GraduationCap,
    CalendarDays, BookOpen, Layers, LayoutGrid
} from 'lucide-react';
import { Header } from '../../../dashboardUtilities.jsx';
import { useAuth } from '../../../../../contexts/AuthContext.jsx';
import {Images} from "../../../../../components/images.jsx";
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
} from "../../../../../components/ui/alert-dialog";

export const Sidebar = ({ isMiniSidebar = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { logout } = useAuth();

    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const handleLogout = async () => {
        await logout();
    };



    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, link: '/dashboard/admin', sec_bar: []},
        { name: 'User Management', icon: Users, link: '/dashboard/admin/users', sec_bar: []},
        { name: 'Students', icon: GraduationCap, link: '/dashboard/admin/students', sec_bar: []},
        { name: 'School Profile', icon: School, link: '/dashboard/admin/school-profile', sec_bar: []},
        { name: 'Configuration', icon: CalendarDays, link: '/dashboard/admin/config',
        sec_bar: [{
                id: 'subjects',
                label: 'Subject Setup',
                icon: BookOpen,
                desc: 'Define the global school subjects'
            },
            {
                id: 'classes',
                label: 'Class Setup',
                icon: Layers,
                desc: 'Configure arms, streams and taxonomy'
            },
            {
                id: 'calendar',
                label: 'Calendar Settings',
                icon: CalendarDays,
                desc: 'Set terms, years, and holidays'
            },
            {
                id: 'timetable',
                label: 'Timetable Builder',
                icon: LayoutGrid,
                desc: 'Construct the drag-and-drop grid'
            }]},
    ];

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const updateTheme = () => {
            setIsDark(document.documentElement.dataset.theme === 'dark');
        };
        updateTheme();
        window.addEventListener('themeChange', updateTheme);

        return () => {
            window.removeEventListener('themeChange', updateTheme);
        };
    }, []);


    return (
        <>
            {/* Mobile Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg "
                >
                    <Menu className="w-6 h-6 text-gray-600" />
                </button>
            )}

            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 
                    flex flex-col h-screen transition-all duration-300 ease-in-out
                    lg:translate-x-0 lg:sticky lg:top-0
                    ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
                    ${isMiniSidebar ? 'lg:w-[72px]' : 'lg:w-64'}
                `}>

                <div className={`flex items-center h-16 border-b border-gray-200 shrink-0 ${isMiniSidebar ? 'justify-center px-0' : 'justify-between px-6'}`}>
                    {isDark ? (
                        <img src={`${Images.main_logo_light}`} alt="Logo" className={isMiniSidebar ? "w-8 h-8 object-cover object-left" : "w-32"} />
                    ) : (
                        <img src={`${Images.main_logo}`} alt="Logo" className={isMiniSidebar ? "w-8 h-8 object-cover object-left" : "w-32"} />
                    )}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-600 p-2"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className={`flex-1 overflow-y-auto pt-6 ${isMiniSidebar ? 'px-2' : 'px-4'}`}>
                    {!isMiniSidebar && (
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                          Menu
                      </p>
                    )}
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.link}
                                end={item.name === 'Dashboard'}
                                className={({ isActive }) =>
                                    `flex items-center rounded-lg transition duration-150 group relative ${isMiniSidebar ? 'justify-center p-3' : 'p-3'} ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-600 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!isMiniSidebar && <span className="flex-1 text-sm ml-3">{item.name}</span>}
                                {isMiniSidebar && (
                                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap transition-opacity">
                                        {item.name}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-200 shrink-0 relative z-60">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className={`flex items-center cursor-pointer w-full text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition duration-150 group relative ${isMiniSidebar ? 'justify-center p-3' : 'p-3'}`}
                            >
                                <LogOut className="w-5 h-5 shrink-0" />
                                {!isMiniSidebar && <span className="ml-3">Logout</span>}
                                {isMiniSidebar && (
                                    <div className="absolute left-full ml-3 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap transition-opacity">
                                        Logout
                                    </div>
                                )}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to logout?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className={` bg-red-600`}
                                    onClick={handleLogout}
                                >Logout</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>


        </>
    );
}

export const MiniSidebar = ({ activeTab, setActiveTab}) => {

    return (
        <div className="shrink-0 border-r border-gray-200 bg-gray-50/50 flex flex-col w-full lg:w-64 lg:h-full transition-all">
            <div className="p-4 border-b border-gray-200 hidden lg:block shrink-0">
                <h2 className="text-sm font-black uppercase text-gray-400 tracking-widest">Configuration</h2>
                <p className="text-lg font-bold text-gray-900 leading-tight mt-1">Academic Engine</p>
            </div>

            {/* Subnav List */}
            <div className="flex-1 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden hide-scrollbar p-2 lg:p-4 border-b border-gray-200 lg:border-b-0">
                <ul className="flex flex-row lg:flex-col gap-1 lg:gap-2 m-0 p-0 list-none">
                    {sections.map(sec => {
                        const isActive = activeTab === sec.id;
                        const Icon = sec.icon;
                        return (
                            <li key={sec.id} className="shrink-0">
                                <button
                                    onClick={() => setActiveTab(sec.id)}
                                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-all border ${
                                        isActive
                                            ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                                            : 'border-transparent hover:bg-gray-200/50 hover:border-gray-300/50'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <div className="flex flex-col hidden lg:flex">
                       <span className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                         {sec.label}
                       </span>
                                        <span className={`text-xs ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                         {sec.desc}
                       </span>
                                    </div>
                                    {/* Mobile Label Only */}
                                    <div className="flex flex-col lg:hidden justify-center h-full">
                       <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                         {sec.label}
                       </span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    )
}


const AdminLayout = ({ children, isMiniSidebar = false }) => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar isMiniSidebar={isMiniSidebar} />
            <div className="flex-1 flex flex-col">
                <Header/>
                <main className="flex-1 p-2 md:p-4 lg:p-6 items-center content-center justify-center ">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
