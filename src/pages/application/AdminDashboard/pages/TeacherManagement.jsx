import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, MoreVertical } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { getDashboardUsers } from '../services/adminService';
import { getInitials, formatDate } from '../utils/formatters.js';
import { getStatusBadgeStyle } from '../utils/styleHelpers.js';
import { Toast } from '../components/ui/Toast.jsx';
import {
    InviteTeacherModal,
    DeleteUserModal,
    StatusChangeModal,
    AssignStudentsToTeacherModal,
    UnassignStudentFromTeacherModal,
    AssignClassesModal,
    UnassignClassesModal
} from '../components/ui/modals.jsx';
import { useAuth } from '../../../../contexts/AuthContext.jsx';

const TeacherManagement = () => {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters and Display state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [subjectFilter, setSubjectFilter] = useState('All Subjects');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Modals state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [modalType, setModalType] = useState(null); // 'status', 'delete', 'assignStudents', 'unassignStudents', 'assignClasses', 'unassignClasses'
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const showToast = (message, type = 'error') => setToast({ show: true, message, type });

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            // Fetch users with role 'teacher'
            const response = await getDashboardUsers('teacher', '');
            const userList = response.data.users.map(userInfo => ({
                id: userInfo.id,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                name: `${userInfo.firstName} ${userInfo.lastName}`,
                email: userInfo.email,
                role: userInfo.role,
                status: userInfo.isActive,
                statusDisplay: userInfo.statusDisplay,
                subjects: userInfo.subjects || [],
                classes: userInfo.classes || [],
                phone: userInfo.phone || '+234 801 234 5678', // mock fallback
                updatedAt: userInfo.updatedAt
            }));
            setTeachers(userList);
        } catch (err) {
            console.error('Failed to fetch teachers:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Derived states
    const allSubjects = useMemo(() => {
        const subjects = new Set();
        teachers.forEach(t => t.subjects?.forEach(s => subjects.add(s)));
        return Array.from(subjects);
    }, [teachers]);

    const activeCount = teachers.filter(t => t.status).length;
    const inactiveCount = teachers.length - activeCount;

    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  t.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true :
                                  statusFilter === 'Active' ? t.status : !t.status;
            const matchesSubject = subjectFilter === 'All Subjects' ? true :
                                   (t.subjects && t.subjects.includes(subjectFilter));
            return matchesSearch && matchesStatus && matchesSubject;
        });
    }, [teachers, searchQuery, statusFilter, subjectFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTeachers = filteredTeachers.slice(startIndex, startIndex + itemsPerPage);

    const handleAction = (teacher, action) => {
        setSelectedTeacher(teacher);
        setModalType(action);
    };

    const closeModals = () => {
        setSelectedTeacher(null);
        setModalType(null);
        setShowInviteModal(false);
    };

    if (loading) {
        return (
            <AdminLayout className="content-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Teachers...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return <AdminLayout><div className="text-center py-8 text-red-500">Failed to load teachers.</div></AdminLayout>;
    }

    return (
        <AdminLayout>
            {toast.show && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            )}

            <div className="space-y-6">
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
                    <p className="text-sm text-gray-500">Manage teacher profiles, assignments, and activity.</p>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#FFF8E7] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-amber-800/70 font-medium mb-1">Total teachers</p>
                        <h2 className="text-4xl font-bold text-gray-900">{teachers.length}</h2>
                    </div>
                    <div className="bg-[#F0FAF5] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-emerald-800/70 font-medium mb-1">Active</p>
                        <h2 className="text-4xl font-bold text-gray-900">{activeCount}</h2>
                    </div>
                    <div className="bg-[#FFF0EB] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-red-800/70 font-medium mb-1">On Leave/Inactive</p>
                        <h2 className="text-4xl font-bold text-gray-900">{inactiveCount}</h2>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search teachers..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={subjectFilter}
                            onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700  bg-white min-w-[140px]"
                        >
                            <option value="All Subjects">All Subjects</option>
                            {allSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                        
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700  bg-white min-w-[120px]"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>

                        <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0 border border-gray-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm shrink-0"
                        >
                            <Plus size={18} />
                            Add Teacher
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {currentTeachers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
                        No teachers found matching your filters.
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {currentTeachers.map((teacher) => (
                                    <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                                                    {getInitials(teacher.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900 truncate" title={teacher.name}>{teacher.name}</h3>
                                                    <p className="text-xs text-gray-500 truncate" title={teacher.classes?.join(', ') || 'No Classes Assigned'}>
                                                        {teacher.classes?.join(', ') || 'No Classes'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${teacher.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {teacher.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6 flex-1">
                                            {teacher.subjects && teacher.subjects.length > 0 ? (
                                                teacher.subjects.map((sub, i) => (
                                                    <span key={i} className="px-3 py-1 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        {sub}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No subjects assigned</span>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-xs text-gray-500 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 truncate">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate" title={teacher.email}>{teacher.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{teacher.phone}</span>
                                            </div>
                                        </div>

                                        {/* Actions Dropdown Button */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="relative inline-block text-left">
                                                <button 
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors bg-white/80 backdrop-blur"
                                                    onClick={(e) => {
                                                        const el = e.currentTarget.nextElementSibling;
                                                        el.classList.toggle('hidden');
                                                    }}
                                                    onBlur={(e) => {
                                                        const el = e.currentTarget.nextElementSibling;
                                                        setTimeout(() => el.classList.add('hidden'), 200);
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                <div className="hidden absolute right-0 mt-1 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 border border-gray-100 overflow-hidden">
                                                    <div className="py-1" role="menu">
                                                        <button onClick={() => handleAction(teacher, 'status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Change Status</button>
                                                        <button onClick={() => handleAction(teacher, 'assignClasses')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Assign Classes</button>
                                                        <button onClick={() => handleAction(teacher, 'unassignClasses')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Unassign Classes</button>
                                                        <button onClick={() => handleAction(teacher, 'assignStudents')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Assign Students</button>
                                                        <button onClick={() => handleAction(teacher, 'unassignStudents')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Unassign Students</button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button onClick={() => handleAction(teacher, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove Teacher</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50/80 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects & Classes</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentTeachers.map((teacher) => (
                                                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
                                                                {getInitials(teacher.name)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-600">{teacher.email}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{teacher.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-700 font-medium truncate max-w-[200px]" title={teacher.subjects?.join(', ')}>{teacher.subjects?.join(', ') || '-'}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]" title={teacher.classes?.join(', ')}>{teacher.classes?.join(', ') || '-'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${teacher.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                            {teacher.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="relative inline-block text-left">
                                                            <button 
                                                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                                                onClick={(e) => {
                                                                    const el = e.currentTarget.nextElementSibling;
                                                                    el.classList.toggle('hidden');
                                                                }}
                                                                onBlur={(e) => {
                                                                    const el = e.currentTarget.nextElementSibling;
                                                                    setTimeout(() => el.classList.add('hidden'), 200);
                                                                }}
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            <div className="hidden absolute right-0 mt-1 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 border border-gray-100 overflow-hidden text-left">
                                                                <div className="py-1" role="menu">
                                                                    <button onClick={() => handleAction(teacher, 'status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Change Status</button>
                                                                    <button onClick={() => handleAction(teacher, 'assignClasses')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Assign Classes</button>
                                                                    <button onClick={() => handleAction(teacher, 'unassignClasses')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Unassign Classes</button>
                                                                    <div className="border-t border-gray-100 my-1"></div>
                                                                    <button onClick={() => handleAction(teacher, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove Teacher</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 font-medium px-4">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showInviteModal && <InviteTeacherModal onClose={closeModals} showToast={showToast} onTeacherAdded={fetchTeachers} />}
            
            {modalType === 'status' && selectedTeacher && (
                <StatusChangeModal onClose={closeModals} showToast={showToast} user={selectedTeacher} schoolId={user.schoolId} />
            )}
            
            {modalType === 'delete' && selectedTeacher && (
                <DeleteUserModal onClose={closeModals} showToast={showToast} user={selectedTeacher} schoolId={user.schoolId} />
            )}
            
            {modalType === 'assignStudents' && selectedTeacher && (
                <AssignStudentsToTeacherModal onClose={closeModals} showToast={showToast} teacher={selectedTeacher} schoolId={user.schoolId} />
            )}
            
            {modalType === 'unassignStudents' && selectedTeacher && (
                <UnassignStudentFromTeacherModal onClose={closeModals} showToast={showToast} teacher={selectedTeacher} schoolId={user.schoolId} />
            )}
            
            {modalType === 'assignClasses' && selectedTeacher && (
                <AssignClassesModal onClose={closeModals} showToast={showToast} teacher={selectedTeacher} schoolId={user.schoolId} />
            )}
            
            {modalType === 'unassignClasses' && selectedTeacher && (
                <UnassignClassesModal onClose={closeModals} showToast={showToast} teacher={selectedTeacher} schoolId={user.schoolId} />
            )}
        </AdminLayout>
    );
};

export default TeacherManagement;
