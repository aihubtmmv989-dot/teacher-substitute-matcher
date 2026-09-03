import React, { useState } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Edit3,
} from 'lucide-react';
import { Teacher, TeacherSchedule, PeriodSlot, PeriodId } from '../types';
import { PERIOD_IDS, PERIOD_TIMES } from '../data/initialData';

interface MasterTimetableProps {
  teachers: Teacher[];
  schedules: Record<string, TeacherSchedule>;
  onNavigateToAdmin: () => void;
}

export const MasterTimetable: React.FC<MasterTimetableProps> = ({
  teachers,
  schedules,
  onNavigateToAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  // Collect all unique subjects across all schedules
  const allSubjects = Array.from(
    new Set(
      (Object.values(schedules) as TeacherSchedule[]).flatMap((sched) =>
        (Object.values(sched.periods) as PeriodSlot[])
          .filter((p) => !p.isFree && p.subject !== 'FREE')
          .map((p) => p.subject)
      )
    )
  ).sort();

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.primarySubjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedSubjectFilter !== 'ALL') {
      const teachSched = schedules[teacher.id];
      if (!teachSched) return false;
      const teachesFilteredSubject = (Object.values(teachSched.periods) as PeriodSlot[]).some(
        (p) => p.subject.toLowerCase() === selectedSubjectFilter.toLowerCase()
      );
      return teachesFilteredSubject;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            <span>School Master Schedule</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Master School Timetable</h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete period allocations (P1 - P8) for all registered teaching staff.
          </p>
        </div>

        <button
          id="timetable-edit-btn"
          type="button"
          onClick={onNavigateToAdmin}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Timetable in Admin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="timetable-search-input"
            type="text"
            placeholder="Search teacher or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-600 shrink-0">Subject Filter:</span>
          <select
            id="timetable-subject-filter"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <span className="font-bold text-slate-700">Period Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 shadow-2xs"></span>
          <span>Teaching Class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300"></span>
          <span className="font-semibold text-emerald-800">FREE Period (Available for Relief)</span>
        </div>
      </div>

      {/* Main Timetable Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3.5 px-4 sticky left-0 z-20 bg-slate-900 border-r border-slate-800 min-w-[200px]">
                  Teacher & Subjects
                </th>
                {PERIOD_IDS.map((p) => (
                  <th key={p} className="py-3.5 px-3 text-center border-r border-slate-800 min-w-[110px]">
                    <div className="font-bold text-sm text-indigo-200">{p}</div>
                    <div className="text-[10px] text-slate-400 font-normal tracking-tight">
                      {PERIOD_TIMES[p]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTeachers.map((teacher, idx) => {
                const sched = schedules[teacher.id];
                const isEven = idx % 2 === 0;

                return (
                  <tr key={teacher.id} className={isEven ? 'bg-white' : 'bg-slate-50/50'}>
                    {/* Teacher Name & Subject column */}
                    <td className="py-3 px-4 sticky left-0 z-10 bg-inherit border-r border-slate-200">
                      <div className="font-bold text-slate-900 text-sm">{teacher.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {teacher.primarySubjects.join(', ')}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-medium">
                        Grades: {teacher.gradesTaught.join(', ')}
                      </div>
                    </td>

                    {/* Periods P1..P8 */}
                    {PERIOD_IDS.map((p) => {
                      const slot = sched?.periods[p];
                      const isFree = !slot || slot.isFree || slot.class === 'FREE';

                      return (
                        <td
                          key={p}
                          className={`py-2 px-2 text-center border-r border-slate-200 transition-colors ${
                            isFree ? 'bg-emerald-50/70 hover:bg-emerald-100/70' : 'hover:bg-slate-100/70'
                          }`}
                        >
                          {isFree ? (
                            <div className="py-2">
                              <span className="inline-block px-2.5 py-1 rounded bg-emerald-100/80 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                FREE
                              </span>
                              <span className="block text-[10px] text-emerald-600 mt-0.5">
                                Relief Ready
                              </span>
                            </div>
                          ) : (
                            <div className="py-1">
                              <div className="font-bold text-slate-900 text-xs">
                                {slot?.class}
                              </div>
                              <div className="text-[11px] font-semibold text-indigo-700 truncate max-w-[100px] mx-auto">
                                {slot?.subject}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
