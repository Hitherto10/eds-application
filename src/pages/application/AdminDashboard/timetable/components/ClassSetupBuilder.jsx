import React, { useState } from 'react';
import { useTimetable } from '../TimetableContext';
import { bulkCreateClasses, deleteClass } from '../../services/classAPIs';
import { registryStyles } from '../../../../../utils/imports';
import { Layers, Search, CheckCircle2, Loader2, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function ClassSetupBuilder() {
  const { state, dispatch } = useTimetable();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');

  // Matrix generation state
  const [baseLevels, setBaseLevels] = useState([]);
  const [streams, setStreams] = useState([]); // Array of strings (e.g. 'A', 'B', 'Science')
  const [matrix, setMatrix] = useState({}); // { 'JSS 1': ['A', 'B'], ... }

  // Custom UI bits
  const [newStreamInput, setNewStreamInput] = useState('');
  const [newBaseInput, setNewBaseInput] = useState('');
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Base Levels Initialization
  // ─────────────────────────────────────────────────────────────────────────────
  const loadRegistryStyle = (styleId) => {
    const style = registryStyles.find(s => s.id === styleId);
    if (!style) return;
    setBaseLevels([...new Set([...baseLevels, ...style.levels])]);
    // Auto-populate matrix keys
    const newMatrix = { ...matrix };
    style.levels.forEach(lv => {
      if (!newMatrix[lv]) newMatrix[lv] = [];
    });
    setMatrix(newMatrix);
  };

  const addCustomBaseLevel = (e) => {
    e.preventDefault();
    const val = newBaseInput.trim();
    if (!val || baseLevels.includes(val)) return;
    setBaseLevels([...baseLevels, val]);
    setMatrix({ ...matrix, [val]: [] });
    setNewBaseInput('');
  };

  const removeBaseLevel = (lv) => {
    setBaseLevels(baseLevels.filter(x => x !== lv));
    const newM = { ...matrix };
    delete newM[lv];
    setMatrix(newM);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Streams / Arms Management
  // ─────────────────────────────────────────────────────────────────────────────
  const addStream = (e) => {
    e.preventDefault();
    const val = newStreamInput.trim();
    if (!val || streams.includes(val)) return;
    setStreams([...streams, val]);
    setNewStreamInput('');
  };

  const removeStream = (streamName) => {
    setStreams(streams.filter(x => x !== streamName));
    // Remove it from all matrix mappings
    const newM = { ...matrix };
    Object.keys(newM).forEach(lv => {
       newM[lv] = newM[lv].filter(s => s !== streamName);
    });
    setMatrix(newM);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Matrix Mapping
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleMatrixMapping = (level, stream) => {
    const current = matrix[level] || [];
    const newM = { ...matrix };
    if (current.includes(stream)) {
      newM[level] = current.filter(s => s !== stream);
    } else {
      newM[level] = [...current, stream];
    }
    setMatrix(newM);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Preview & Save
  // ─────────────────────────────────────────────────────────────────────────────
  const getGeneratedClasses = () => {
    const result = [];
    baseLevels.forEach(lv => {
       const mappedStreams = matrix[lv] || [];
       if (mappedStreams.length === 0) {
         // If no streams mapped, the base level itself represents the single class
         result.push({ baseLevel: lv, arm: null, name: lv });
       } else {
         // Generate permutations
         mappedStreams.forEach(st => {
           result.push({ baseLevel: lv, arm: st, name: `${lv} ${st}` });
         });
       }
    });
    return result;
  };

  const generatedCount = getGeneratedClasses().length;

  const handleSaveMatrix = async () => {
     if (generatedCount === 0) return alert('No classes properly generated in the matrix mapping.');
     if (!confirm(`Save and generate ${generatedCount} classes to the registry?`)) return;

     setLoading(true);
     const payload = { classes: getGeneratedClasses() };
     
     try {
       const res = await bulkCreateClasses(payload);
       if (res.success) {
         dispatch({ type: 'SET_CLASSES', payload: res.data.classes });
         setSuccess(true);
         setTimeout(() => setSuccess(false), 3000);
       }
     } catch(err) {
       console.error(err);
       alert('Failed to save generated classes.');
     } finally {
       setLoading(false);
     }
  };

  const handleDeleteRemoteClass = async (id) => {
    if (!confirm('Are you certain? This removes the class block completely from the system.')) return;
    try {
      const res = await deleteClass(id);
      if (res.success) {
        dispatch({ type: 'SET_CLASSES', payload: state.classes.filter(c => c.id !== id) });
      }
    } catch (e) {
      console.error(e);
    }
  };


  // ─────────────────────────────────────────────────────────────────────────────
  // UI Render
  // ─────────────────────────────────────────────────────────────────────────────
  const hasExistingData = state.classes.length > 0;
  
  if (hasExistingData) {
    // Show active existing classes grid
    const filtered = state.classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    
    return (
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 flex flex-col relative h-full">
         <div className="flex items-center justify-between mb-6 shrink-0">
           <div>
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <Layers className="text-blue-600" />
               School Class Structure ({state.classes.length})
             </h2>
             <p className="text-sm text-gray-500 mt-1">Manage the finalized taxonomy assigned to the timetable.</p>
           </div>
           
           <div className="flex items-center gap-4">
             {success && (
               <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                 <CheckCircle2 size={14} /> Structure Saved
               </span>
             )}
             <div className="relative">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search classes..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
               />
             </div>
             {/* Note: This allows blowing away everything to rebuild. In standard apps we might want purely append approach. */}
             <button 
               onClick={() => {
                 if (confirm('Clear visual matrix and inject new classes?')) {
                    dispatch({ type: 'SET_CLASSES', payload: [] });
                 }
               }}
               className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition"
             >
               <Plus size={16} /> Matrix Builder
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-1 bg-gray-50 border border-gray-100 rounded-xl p-4">
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
             {filtered.map(c => (
               <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center group shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex flex-col truncate">
                     <span className="font-bold text-gray-800 text-sm truncate">{c.name}</span>
                     {c.arm && <span className="text-[10px] uppercase font-bold text-gray-400 mt-0.5 tracking-wider">{c.baseLevel} • {c.arm}</span>}
                     {!c.arm && <span className="text-[10px] uppercase font-bold text-gray-400 mt-0.5 tracking-wider">Base Block</span>}
                  </div>
                  <button onClick={() => handleDeleteRemoteClass(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
               </div>
             ))}
             {filtered.length === 0 && (
               <p className="col-span-full py-8 text-center text-gray-500">No classes found matching {search}</p>
             )}
           </div>
        </div>
      </div>
    )
  }

  // Builder Matrix Interface
  return (
    <div className="flex-1 bg-gray-50 flex flex-col relative h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200 shrink-0">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="text-blue-600" /> Matrix Generation Builder
              </h2>
              <p className="text-sm text-gray-500 mt-1">Construct your class taxonomy visually by mapping arms to base levels.</p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-500 font-semibold mb-0.5 uppercase tracking-wider">Output Pool</div>
                <div className="text-xl font-black text-blue-600">{generatedCount} <span className="text-sm text-gray-500 font-bold">Classes</span></div>
              </div>
              <button 
                onClick={handleSaveMatrix}
                disabled={loading || generatedCount === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-sm flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Commit Matrix
              </button>
           </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-full items-stretch">
           
           {/* Left Sidebar Form (Styles, Base, Streams) */}
           <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
              
              {/* Presets */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs uppercase font-black text-gray-400 tracking-widest mb-3">1. Adopt Base Registry</h3>
                <div className="space-y-2">
                  {registryStyles.map(rs => (
                    <button 
                       key={rs.id} 
                       onClick={() => loadRegistryStyle(rs.id)}
                       className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition group"
                    >
                      <div className="font-bold text-sm text-gray-800 flex justify-between items-center">
                        {rs.name} <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{rs.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Levels */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <h3 className="text-xs uppercase font-black text-gray-400 tracking-widest mb-3">Add Custom Base</h3>
                <form onSubmit={addCustomBaseLevel} className="flex gap-2 mb-3">
                  <input required placeholder="e.g. Advanced Placement" value={newBaseInput} onChange={e=>setNewBaseInput(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:ring-2" />
                  <button type="submit" className="px-3 bg-gray-900 text-white rounded text-sm font-bold hover:bg-black"><Plus size={16}/></button>
                </form>
                {baseLevels.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {baseLevels.map(lv => (
                      <span key={lv} className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700">
                        {lv} <button onClick={() => removeBaseLevel(lv)} className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Streams Configurator */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[200px]">
                <h3 className="text-xs uppercase font-black text-gray-400 tracking-widest mb-3">2. Define Arms/Streams</h3>
                <p className="text-[11px] text-gray-500 mb-3 leading-tight hidden sm:block">Define the suffixes appended to classes. (e.g. "A", "B", "Science", "Commercial")</p>
                
                <form onSubmit={addStream} className="flex gap-2 mb-3">
                  <input required placeholder="e.g. Science" value={newStreamInput} onChange={e=>setNewStreamInput(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:ring-2" />
                  <button type="submit" className="px-3 bg-gray-900 text-white rounded text-sm font-bold hover:bg-black"><Plus size={16}/></button>
                </form>

                <div className="flex-1 bg-gray-50 rounded-lg border border-gray-100 p-2 flex flex-col gap-1.5 overflow-y-auto">
                   {streams.length === 0 ? (
                     <div className="text-center text-xs text-gray-400 py-4 italic">No streams defined.</div>
                   ) : (
                     streams.map(stream => (
                       <div key={stream} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-200 shadow-sm">
                         <span className="text-sm font-bold text-gray-800">{stream}</span>
                         <button onClick={() => removeStream(stream)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                       </div>
                     ))
                   )}
                </div>
              </div>

           </div>

           {/* Right Center Action Workspace: The Matrix */}
           <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                 <h3 className="text-sm font-bold text-gray-800">3. Map The Matrix</h3>
                 <p className="text-xs text-gray-500">Toggle which streams are assigned to which base levels. Empty rows become standalone classes.</p>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-auto p-4 hide-scrollbar">
                 {baseLevels.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                         <Layers className="text-gray-300 w-8 h-8" />
                      </div>
                      <p className="text-sm font-medium">Adopt a base registry to begin mapping.</p>
                    </div>
                 ) : (
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr>
                         <th className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500 tracking-wider sticky top-0 left-0 z-10 w-48">Base Level</th>
                         {streams.map(st => (
                           <th key={st} className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500 tracking-wider sticky top-0 text-center min-w-[80px]">
                             {st}
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody>
                       {baseLevels.map(lv => (
                         <tr key={lv} className="group hover:bg-blue-50/30">
                           <td className="p-3 border-b border-gray-100 text-sm font-bold text-gray-800 bg-white sticky left-0 group-hover:bg-blue-50/30 transition-colors">
                             {lv}
                           </td>
                           {streams.map(st => {
                             const isMapped = matrix[lv]?.includes(st);
                             return (
                               <td key={st} className="p-3 border-b border-gray-100 text-center">
                                 <button 
                                   onClick={() => toggleMatrixMapping(lv, st)}
                                   className={`w-6 h-6 mx-auto rounded flex items-center justify-center border transition-all ${
                                     isMapped 
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-110' 
                                      : 'bg-gray-50 border-gray-200 text-transparent hover:border-blue-400 group-hover:bg-white'
                                   }`}
                                 >
                                   <CheckCircle2 size={14} />
                                 </button>
                               </td>
                             );
                           })}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
