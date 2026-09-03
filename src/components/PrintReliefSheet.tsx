import React, { useState } from 'react';
import {
  Printer,
  Calendar,
  AlertTriangle,
  FileCheck,
  Edit2,
  Building,
} from 'lucide-react';
import { DailyReliefPlan, Teacher, AbsenceRecord } from '../types';
import { PERIOD_TIMES } from '../data/initialData';

interface PrintReliefSheetProps {
  currentPlan: DailyReliefPlan | null;
  selectedDate: string;
  formattedDate: string;
  teachers: Teacher[];
  absences: AbsenceRecord[];
  schoolName: string;
  principalName: string;
  academicTerm: string;
  academicYear: string;
}

export const PrintReliefSheet: React.FC<PrintReliefSheetProps> = ({
  currentPlan,
  selectedDate,
  formattedDate,
  teachers,
  absences,
  schoolName,
  principalName,
  academicTerm,
  academicYear,
}) => {
  const [adminNotes, setAdminNotes] = useState<string>(
    '1. Relief teachers are requested to report promptly to the assigned classroom. 2. Collect lesson material / class textbooks from the staffroom if available. 3. Maintain student attendance register during the period.'
  );
  const [principalNotes, setPrincipalNotes] = useState<string>(
    'Approved. Section heads will coordinate with student prefects for any uncovered periods.'
  );

  const activeAbsences = absences.filter((a) => a.date === selectedDate);
  const assignments = currentPlan?.assignments || [];
  const uncoveredAssignments = assignments.filter((a) => a.status === 'no_relief');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar - Hidden during actual print */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official Document Generator</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Print Daily Relief Sheet</h1>
          <p className="text-sm text-slate-600 mt-1">
            Generate and print the official staffroom substitution notice and Principal's report.
          </p>
        </div>

        <button
          id="print-sheet-action-btn"
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
        >
          <Printer className="w-5 h-5" />
          <span>Print Daily Relief Sheet</span>
        </button>
      </div>

      {/* Printable Sheet Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-sans">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-600 font-semibold mb-1">
            School Administration & Staff Substitution System
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">
            {schoolName}
          </h2>
          <div className="text-sm font-bold text-indigo-900 mt-1 uppercase tracking-wider">
            Daily Teacher Relief & Substitution Notice
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-700 font-medium">
            <span>
              <strong>Date:</strong> {formattedDate}
            </span>
            <span>•</span>
            <span>
              <strong>Term / Year:</strong> {academicTerm} ({academicYear})
            </span>
            <span>•</span>
            <span>
              <strong>Generated:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Section 1: Absent Staff Summary */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
            1. Absent Teaching Staff ({activeAbsences.length})
          </h3>
          {activeAbsences.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">
              No teachers reported absent for this date.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {activeAbsences.map((abs) => {
                const teacher = teachers.find((t) => t.id === abs.teacherId);
                return (
                  <div
                    key={abs.id}
                    className="p-2.5 rounded border border-slate-200 bg-slate-50/70"
                  >
                    <div className="font-bold text-slate-900 text-sm">
                      {abs.teacherName}
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Subject: {teacher?.primarySubjects.join(', ')}
                    </div>
                    <div className="text-slate-700 font-medium mt-1">
                      Coverage:{' '}
                      <span className="font-bold">
                        {abs.type === 'whole_day' ? 'Whole Day (P1 - P8)' : abs.periods.join(', ')}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Reason: {abs.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Relief Duty Allocations Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              2. Relief Duty Allocations ({assignments.length} periods)
            </h3>
            {currentPlan?.confirmed ? (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Official Roster Confirmed
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Provisional Schedule
              </span>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              No relief periods required or matched. Please run the Substitute Matcher first.
            </div>
          ) : (
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2 px-3 border-r border-slate-300 w-16 text-center">Period</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-24">Time</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-16">Class</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28">Subject</th>
                  <th className="py-2 px-3 border-r border-slate-300">Absent Teacher</th>
                  <th className="py-2 px-3 border-r border-slate-300">Assigned Substitute</th>
                  <th className="py-2 px-3 w-20 text-center">Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assignments.map((assignment) => {
                  const isNoRelief = assignment.status === 'no_relief';
                  return (
                    <tr
                      key={assignment.id}
                      className={isNoRelief ? 'bg-amber-50 font-medium' : ''}
                    >
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">
                        {assignment.period}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-slate-600 text-[11px]">
                        {PERIOD_TIMES[assignment.period]}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 font-bold">
                        {assignment.class}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">
                        {assignment.subject}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-slate-600">
                        {assignment.absentTeacherName}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">
                        {isNoRelief ? (
                          <div className="font-bold text-rose-700">
                            ⚠ NO AVAILABLE TEACHER — INFORM PRINCIPAL
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900">
                              {assignment.assignedTeacherName}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {assignment.reason}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center border-slate-300">
                        {isNoRelief ? (
                          <span className="text-[10px] text-rose-700 font-bold">N/A</span>
                        ) : (
                          <div className="w-14 h-6 border-b border-dotted border-slate-400 mx-auto"></div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 3: Notice if any period is uncovered */}
        {uncoveredAssignments.length > 0 && (
          <div className="mb-6 p-3 border-2 border-dashed border-amber-500 rounded bg-amber-50 text-amber-950 text-xs">
            <div className="font-black flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Special Attention Required by Principal ({uncoveredAssignments.length} Period/s)
            </div>
            <p className="mt-1 text-slate-700">
              The following periods could not be covered due to zero timetable availability:{' '}
              <strong>
                {uncoveredAssignments
                  .map((a) => `${a.period} (${a.class} ${a.subject})`)
                  .join(', ')}
              </strong>
              . Principal's instruction for library study / combined supervision is required.
            </p>
          </div>
        )}

        {/* Section 4: Notes (Editable on screen) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs">
          <div>
            <label className="block font-black uppercase tracking-wider text-slate-800 mb-1">
              Admin / Staffroom Notes
            </label>
            <textarea
              id="print-sheet-admin-notes"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full text-xs p-2 rounded border border-slate-300 text-slate-800 bg-white print:border-none print:p-0 resize-none"
            />
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-slate-800 mb-1">
              Principal / Deputy Notes
            </label>
            <textarea
              id="print-sheet-principal-notes"
              rows={3}
              value={principalNotes}
              onChange={(e) => setPrincipalNotes(e.target.value)}
              className="w-full text-xs p-2 rounded border border-slate-300 text-slate-800 bg-white print:border-none print:p-0 resize-none"
            />
          </div>
        </div>

        {/* Section 5: Signature Blocks */}
        <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-400 text-xs">
          <div>
            <div className="h-10 border-b border-slate-500 mb-1"></div>
            <div className="font-bold text-slate-900">Prepared by: Office Administration</div>
            <div className="text-slate-500 text-[11px]">Relief Scheduling Officer</div>
          </div>

          <div>
            <div className="h-10 border-b border-slate-500 mb-1"></div>
            <div className="font-bold text-slate-900">Approved by: {principalName}</div>
            <div className="text-slate-500 text-[11px]">Head of School / Principal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
