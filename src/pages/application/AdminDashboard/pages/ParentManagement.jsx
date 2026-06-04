import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, MoreVertical, Link as LinkIcon } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { getDashboardUsers } from '../services/adminService';
import { getInitials } from '../utils/formatters.js';
import { Toast } from '../components/ui/Toast.jsx';
import {
    InviteParentModal,
    DeleteUserModal,
    StatusChangeModal,
    ManageParentStudentLinkModal
} from '../components/ui/modals.jsx';
import { useAuth } from '../../../../contexts/AuthContext.jsx';

const ParentManagement = () => {
    const { user } = useAuth();
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters and Display state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Modals state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedParent, setSelectedParent] = useState(null);
    const [modalType, setModalType] = useState(null); // 'status', 'delete', 'manageLinks'
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const showToast = (message, type = 'error') => setToast({ show: true, message, type });

    const fetchParents = async () => {
        try {
            setLoading(true);
            const response = await getDashboardUsers('parent', '');
            const userList = response.data.users.map(userInfo => ({
                id: userInfo.id,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                name: `${userInfo.firstName} ${userInfo.lastName}`,
                email: userInfo.email,
                role: userInfo.role,
                status: userInfo.isActive,
                statusDisplay: userInfo.statusDisplay,
                students: userInfo.students || [], // Assuming students are array of {id, name, class}
                phone: userInfo.phone || '+234 801 234 5678', // mock fallback
                updatedAt: userInfo.updatedAt
            }));
            setParents(userList);
        } catch (err) {
            console.error('Failed to fetch parents:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParents();
    }, []);

    // Derived states
    const activeCount = parents.filter(p => p.status).length;
    const inactiveCount = parents.length - activeCount;

    const filteredParents = useMemo(() => {
        return parents.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true :
                                  statusFilter === 'Active' ? p.status : !p.status;
            return matchesSearch && matchesStatus;
        });
    }, [parents, searchQuery, statusFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredParents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentParents = filteredParents.slice(startIndex, startIndex + itemsPerPage);

    const handleAction = (parent, action) => {
        setSelectedParent(parent);
        setModalType(action);
    };

    const closeModals = () => {
        setSelectedParent(null);
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
                    <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Parents...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return <AdminLayout><div className="text-center py-8 text-red-500">Failed to load parents.</div></AdminLayout>;
    }

    return (
        <AdminLayout>
            {toast.show && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            )}

            <div className="space-y-6">
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
                    <p className="text-sm text-gray-500">Manage parent profiles and their linked students.</p>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#FFF8E7] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-amber-800/70 font-medium mb-1">Total parents</p>
                        <h2 className="text-4xl font-bold text-gray-900">{parents.length}</h2>
                    </div>
                    <div className="bg-[#F0FAF5] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-emerald-800/70 font-medium mb-1">Active</p>
                        <h2 className="text-4xl font-bold text-gray-900">{activeCount}</h2>
                    </div>
                    <div className="bg-[#FFF0EB] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-red-800/70 font-medium mb-1">Inactive</p>
                        <h2 className="text-4xl font-bold text-gray-900">{inactiveCount}</h2>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search parents..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
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
                            Add Parent
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {currentParents.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
                        No parents found matching your filters.
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {currentParents.map((parent) => (
                                    <div key={parent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                                                    {getInitials(parent.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 truncate" title={parent.name}>{parent.name}</h3>
                                                    <p className="text-xs text-gray-500">Parent</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${parent.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {parent.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-6 flex-1">
                                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Linked Students</div>
                                            <div className="flex flex-wrap gap-2">
                                                {parent.students && parent.students.length > 0 ? (
                                                    parent.students.map((student, i) => (
                                                        <span key={i} className="px-3 py-1 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                            <LinkIcon size={12} />
                                                            {typeof student === 'string' ? student : student.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No students linked</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-xs text-gray-500 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 truncate">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate" title={parent.email}>{parent.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{parent.phone}</span>
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
                                                        <button onClick={() => handleAction(parent, 'status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Change Status</button>
                                                        <button onClick={() => handleAction(parent, 'manageLinks')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Manage Linked Students</button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button onClick={() => handleAction(parent, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove Parent</button>
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
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked Students</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentParents.map((parent) => (
                                                <tr key={parent.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
                                                                {getInitials(parent.name)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{parent.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-600">{parent.email}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{parent.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {parent.students && parent.students.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {parent.students.map((student, i) => (
                                                                    <span key={i} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                                        {typeof student === 'string' ? student : student.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">-</p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${parent.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                            {parent.status ? 'Active' : 'Inactive'}
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
                                                                    <button onClick={() => handleAction(parent, 'status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Change Status</button>
                                                                    <button onClick={() => handleAction(parent, 'manageLinks')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Manage Linked Students</button>
                                                                    <div className="border-t border-gray-100 my-1"></div>
                                                                    <button onClick={() => handleAction(parent, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove Parent</button>
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
            {showInviteModal && <InviteParentModal onClose={closeModals} showToast={showToast} onParentAdded={fetchParents} />}
            
            {modalType === 'status' && selectedParent && (
                <StatusChangeModal onClose={closeModals} showToast={showToast} user={selectedParent} schoolId={user.schoolId} />
            )}
            
            {modalType === 'delete' && selectedParent && (
                <DeleteUserModal onClose={closeModals} showToast={showToast} user={selectedParent} schoolId={user.schoolId} />
            )}
            
            {modalType === 'manageLinks' && selectedParent && (
                <ManageParentStudentLinkModal onClose={closeModals} showToast={showToast} parent={selectedParent} schoolId={user.schoolId} />
            )}
        </AdminLayout>
    );
};

export default ParentManagement;
