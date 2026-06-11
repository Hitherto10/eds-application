import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, MoreVertical, X, UserCircle2 } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { getAllStudents, updateStudent } from '../../../auth/authAPIs.js';
import { getSchoolClasses } from '../services/classAPIs.js';
import { getClassArms } from '../services/armAPIs.js';
import { getInitials } from '../utils/formatters.js';
import { Toast } from '../components/ui/Toast.jsx';
import Input from '../components/ui/Input.jsx';
import {
    CreateStudentModal,
    DeleteUserModal,
    StatusChangeModal
} from '../components/ui/modals.jsx';
import { useAuth } from '../../../../contexts/AuthContext.jsx';

const StudentManagement = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters and Display state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [classFilter, setClassFilter] = useState('All Classes');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Modals state
    const [createStudent, setCreateStudent] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [modalType, setModalType] = useState(null); // 'status', 'delete', 'view'
    
    // View/Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const showToast = (message, type = 'error') => setToast({ show: true, message, type });

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await getAllStudents();
            // Fetch classes and arms to resolve ids to display names
            const classesRes = await getSchoolClasses();
            const classesList = classesRes.data?.classes ?? [];
            const classMap = {};
            classesList.forEach(c => { if (c?.id) classMap[c.id] = c.name; });

            // Build arm map by fetching arms for each class (if any)
            const armMap = {};
            await Promise.all(classesList.map(async (c) => {
                try {
                    const armsRes = await getClassArms(c.id);
                    const armsList = armsRes.data?.arms ?? [];
                    armsList.forEach(a => { if (a?.id) armMap[a.id] = a.name; });
                } catch (e) {
                    // ignore individual arm fetch errors
                }
            }));

            const studentList = response.data.students.map(userInfo => ({
                id: userInfo.id,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                name: `${userInfo.firstName} ${userInfo.lastName}`,
                email: userInfo?.email || '-',
                role: 'Student',
                // display-friendly values
                class: classMap[userInfo.classId] || '-',
                section: armMap[userInfo.armId] || '-',
                // keep raw ids for updates
                classId: userInfo.classId || null,
                armId: userInfo.armId || null,
                phone: userInfo?.phone || '-',
                address: userInfo?.address || '-',
                dateOfBirth: userInfo.dateOfBirth?.slice(0, 10),
                gender: userInfo.gender,
                status: userInfo.isActive,
                parents: userInfo.parents || [],
                updatedAt: userInfo.updatedAt,
                schoolId: userInfo.schoolId || user.schoolId
            }));
            setStudents(studentList);
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (modalType === 'view' && selectedStudent) {
            // selectedStudent contains both display names (class/section) and ids (classId/armId)
            setFormData({
                schoolId: selectedStudent.schoolId,
                firstName: selectedStudent.firstName || '',
                lastName: selectedStudent.lastName || '',
                email: selectedStudent.email || '',
                // store ids in the form so updates send classId/armId
                class: selectedStudent.classId || '',
                section: selectedStudent.armId || '',
                dateOfBirth: selectedStudent.dateOfBirth || '',
                gender: selectedStudent.gender || '',
                address: selectedStudent.address || '',
                phone: selectedStudent.phone || ''
            });
        }
    }, [modalType, selectedStudent]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        // Send ids to backend for updates
        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            classId: formData.class || null,
            armId: formData.section || null,
            phone: formData.phone
        };

        try {
            await updateStudent(selectedStudent.id, payload);
            showToast('Student updated successfully!', 'success');
            setModalType(null);
            setSelectedStudent(null);
            setIsEditing(false);
            fetchStudents();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Failed to update student.', 'error');
        }
    };

    // Derived states
    const allClasses = useMemo(() => {
        const classes = new Set();
        students.forEach(s => { if (s.class && s.class !== '-') classes.add(s.class) });
        return Array.from(classes);
    }, [students]);

    const activeCount = students.filter(s => s.status).length;
    const inactiveCount = students.length - activeCount;

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  s.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true :
                                  statusFilter === 'Active' ? s.status : !s.status;
            const matchesClass = classFilter === 'All Classes' ? true : s.class === classFilter;
            return matchesSearch && matchesStatus && matchesClass;
        });
    }, [students, searchQuery, statusFilter, classFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    const handleAction = (student, action) => {
        setSelectedStudent(student);
        setModalType(action);
    };

    const closeModals = () => {
        setSelectedStudent(null);
        setModalType(null);
        setCreateStudent(false);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <AdminLayout className="content-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading Students...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return <AdminLayout><div className="text-center py-8 text-red-500">Failed to load students.</div></AdminLayout>;
    }

    return (
        <AdminLayout>
            {toast.show && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            )}

            <div className="space-y-6">
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-sm text-gray-500">Manage student profiles, classes, and information.</p>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#FFF8E7] rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
                        <p className="text-sm text-amber-800/70 font-medium mb-1">Total students</p>
                        <h2 className="text-4xl font-bold text-gray-900">{students.length}</h2>
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
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={classFilter}
                            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
                        >
                            <option value="All Classes">All Classes</option>
                            {allClasses.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

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
                            onClick={() => setCreateStudent(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm shrink-0"
                        >
                            <Plus size={18} />
                            Add Student
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {currentStudents.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
                        No students found matching your filters.
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {currentStudents.map((student) => (
                                    <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                                                    {getInitials(student.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900 truncate" title={student.name}>{student.name}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{student.class} {student.section !== '-' ? `- ${student.section}` : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${student.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {student.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6 flex-1">
                                            <span className="px-3 py-1 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                Class: {student.class}
                                            </span>
                                            {student.section !== '-' && (
                                                <span className="px-3 py-1 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                    Section: {student.section}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-xs text-gray-500 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 truncate">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate" title={student.email}>{student.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{student.phone}</span>
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
                                                        <button onClick={() => handleAction(student, 'view')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">View Details</button>
                                                        <button onClick={() => handleAction(student, 'status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Change Status</button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button onClick={() => handleAction(student, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove Student</button>
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
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class / Section</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
                                                                {getInitials(student.name)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-600">{student.email}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{student.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-700 font-medium truncate">{student.class}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{student.section}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${student.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                            {student.status ? 'Active' : 'Inactive'}
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
                                                                    <button onClick={() => handleAction(student, 'view')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">View Details</button>
                                                                    <button onClick={() => handleAction(student, 'status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Change Status</button>
                                                                    <div className="border-t border-gray-100 my-1"></div>
                                                                    <button onClick={() => handleAction(student, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove Student</button>
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

            {/* View/Edit Modal (Embedded) */}
            {modalType === 'view' && selectedStudent && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModals} />
                        <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
                            <button
                                onClick={closeModals}
                                className="absolute top-6 right-6 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <UserCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Student Details</h3>
                                    <p className="text-sm text-gray-500">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                                        {isEditing ? <Input name="firstName" value={formData.firstName} onChange={handleInputChange} /> : <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.firstName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                                        {isEditing ? <Input name="lastName" value={formData.lastName} onChange={handleInputChange} /> : <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.lastName}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">School ID</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.schoolId}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                                        {isEditing ? <Input name="class" value={formData.class} onChange={handleInputChange} /> : <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.class}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
                                        {isEditing ? <Input name="section" value={formData.section} onChange={handleInputChange} /> : <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.section}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.dateOfBirth}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.gender}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                        {isEditing ? <Input name="phone" value={formData.phone} onChange={handleInputChange} /> : <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{formData.address}</p>
                                    </div>
                                </div>

                                {/* Linked Parents */}
                                <div className="pt-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Linked Parents</label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.parents?.length > 0 ? (
                                            selectedStudent.parents.map((parent, index) => (
                                                <span key={index} className="px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-700 font-medium">
                                                    {parent.name || parent}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No parents linked</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                    {isEditing ? (
                                        <>
                                            <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                            <button onClick={handleUpdateStudent} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">Save Changes</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={closeModals} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
                                            <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">Edit</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Modals */}
            {createStudent && <CreateStudentModal onClose={closeModals} showToast={showToast} onStudentAdded={fetchStudents} />}
            
            {modalType === 'status' && selectedStudent && (
                <StatusChangeModal onClose={closeModals} showToast={showToast} user={selectedStudent} schoolId={user.schoolId} />
            )}
            
            {modalType === 'delete' && selectedStudent && (
                <DeleteUserModal onClose={closeModals} showToast={showToast} user={selectedStudent} schoolId={user.schoolId} />
            )}
        </AdminLayout>
    );
};

export default StudentManagement;