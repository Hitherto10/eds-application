import React, { useState } from 'react';
import { useTimetable } from '../TimetableContext';
import { availableSubjects as defaultSubjects } from '../../../../../utils/imports';
import { BookOpen, Search, Copy, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import {bulkCreateSubjects, createSubject, deleteSubject} from "../../services/subjectAPIs.js";

export default function SubjectSetupBuilder() {
  const { state, dispatch } = useTimetable();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Custom manual form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [search, setSearch] = useState('');

  // 1. Path A: Hybrid/Default Setup
  const handleLoadDefaults = async () => {
    if (!confirm('This will load all standard subjects into the school database. Continue?')) return;
    
    setLoading(true);
    const payload = {
      subjects: defaultSubjects.map(s => ({ name: s, code: s.substring(0, 3).toUpperCase() }))
    };

    try {
      const res = await bulkCreateSubjects(payload);
      if (res.success) {
        dispatch({ type: 'SET_SUBJECTS', payload: res.data.subjects });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load default subjects.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Path B: Custom Single Creation
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    
    setLoading(true);
    try {
      const payload = { name: customName.trim(), code: customCode.trim() || undefined };
      const res = await createSubject(payload);
      
      if (res.success) {
        dispatch({ type: 'ADD_SUBJECT', payload: res.data.subject });
        setCustomName('');
        setCustomCode('');
        setShowCustomForm(false);
      }
    } catch (err) {
       console.error(err);
       alert('Failed to add custom subject.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject entirely?')) return;
    
    // Optimistic UI could be done here, but let's wait
    try {
      const res = await deleteSubject(id);
      if (res.success) {
        dispatch({ type: 'REMOVE_SUBJECT', id });
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Zero-state view
  if (state.subjects.length === 0 && !showCustomForm) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <span className={`text-red-500 text-xs`}>You have not added any subjects yet</span>
            <h2 className="text-2xl font-bold text-gray-900">Configure School Subjects</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Before building timetables, you must define the subjects offered at this school. 
              Choose how you would like to begin.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hybrid Path */}
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-center flex flex-col h-full">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full tracking-wider mb-4">Recommended</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Initialize Standard List</h3>
                <p className="text-sm text-gray-500 text-left">
                  Automatically load dozens of standard school subjects (Mathematics, English, Physics, etc.). You can easily delete unused ones or add missing ones later.
                </p>
              </div>
              <div className="mt-auto pt-6">
                <button 
                  onClick={handleLoadDefaults}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Copy className="w-5 h-5" />} Focus on standard subjects
                </button>
              </div>
            </div>

            {/* Custom Path */}
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-center flex flex-col h-full">
              <div className="mb-4">
               <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold uppercase rounded-full tracking-wider mb-4">Custom</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Blank State</h3>
                <p className="text-sm text-gray-500 text-left">
                  Start with a completely blank slate and manually enter only the precise specialized subjects this institution requires.
                </p>
              </div>
              <div className="mt-auto pt-6">
                <button 
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                   <Plus className="w-5 h-5" /> Add subjects manually
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loaded/Active View
  const filtered = state.subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 overflow-hidden flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
         <div>
           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             School Subjects ({state.subjects.length})
           </h2>
         </div>
         
         <div className="flex items-center gap-4">
           {success && (
             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
               <CheckCircle2 size={14} /> Saved Database
             </span>
           )}
           <div className="relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search subjects..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
             />
           </div>
           <button 
             onClick={() => setShowCustomForm(true)}
             className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition"
           >
             <Plus size={16} /> New Subject
           </button>
         </div>
      </div>

      {showCustomForm && (
        <form onSubmit={handleCreateCustom} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-end gap-4 shrink-0">
           <div className="flex-1">
             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject Name</label>
             <input autoFocus required type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Advanced Physics" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"/>
           </div>
           <div className="w-32">
             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Code (Opt)</label>
             <input type="text" value={customCode} onChange={e => setCustomCode(e.target.value)} placeholder="PHY" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none uppercase"/>
           </div>
           <button disabled={loading} type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
           </button>
           <button type="button" onClick={() => setShowCustomForm(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50">
             Cancel
           </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center group">
              <div className="flex gap-3 items-center truncate">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {s.code || s.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-semibold text-gray-800 text-sm truncate">{s.name}</span>
              </div>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
        ))}
        {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-gray-500">No subjects found matching {search}</p>
        )}
      </div>
    </div>
  );
}
