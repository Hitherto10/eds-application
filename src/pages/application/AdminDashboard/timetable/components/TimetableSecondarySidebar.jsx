import React from 'react';
import { BookOpen, Layers, CalendarDays, LayoutGrid } from 'lucide-react';

/**
 * Supabase-style contextual secondary sidebar.
 * Morph into a horizontal scrolling tab-bar on mobile.
 */
export default function TimetableSecondarySidebar({ activeTab, setActiveTab }) {
  const sections = [
    {
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
    }
  ];

  return (
    <div className="flex-shrink-0 border-r border-gray-200 bg-gray-50/50 flex flex-col w-full lg:w-64 lg:h-full transition-all">
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
  );
}
