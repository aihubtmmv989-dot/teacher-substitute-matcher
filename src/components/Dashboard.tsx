import React from 'react';
import {
  Users,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Printer,
  ArrowRight,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Teacher, AbsenceRecord, ReliefAssignment, DailyReliefPlan } from '../types';
import { NavigationTab } from './Sidebar';

interface DashboardProps {
  todayDateStr: string;
  formattedDate: string;
  teachers: Teacher[];
  absences: AbsenceRecord[];
  currentPlan: DailyReliefPlan | null;
  onNavigate: (tab: NavigationTab) => void;
  onQuickMatch: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  todayDateStr,
  formattedDate,
  teachers,
  absences,
  currentPlan,
  onNavigate,
  onQuickMatch,
}) => {
  const activeTeachersCount = teachers.filter((t) => t.isAvailable).length;
  const todayAbsences = absences.filter((a) => a.date === todayDateStr);
  const absentTeachersCount = todayAbsences.length;

  // Calculate required relief periods today
  // An absence period requires relief if the absent teacher had a scheduled class in that period
  const totalReliefPeriodsRequired = currentPlan
    ? currentPlan.assignments.length
    : 0;

  const unresolvedPeriodsCount = currentPlan
    ? currentPlan.assignments.filter((a) => a.status === 'no_relief').length
    : 0;

  const matchedPeriodsCount = currentPlan
    ? currentPlan.assignments.filter((a) => a.status === 'matched').length
    : 0;

  const isConfirmed = Boolean(currentPlan?.confirmed);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Today's Scheduling Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Teacher Substitute Matcher
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            School Relief Timetable & Daily Substitution Management
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-right">
            <span className="text-xs text-slate-500 font-medium block">Active Scheduling Date</span>
            <span className="text-sm font-semibold text-slate-800">{formattedDate}</span>
          </div>
          <button
            id="dashboard-mark-absence-btn"
            type="button"
            onClick={() => onNavigate('absences')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
          >
            <UserX className="w-4 h-4" />
            <span>Mark Teacher Absent</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Requirement 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Teachers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Teachers
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{teachers.length}</span>
            <span className="text-xs text-slate-500">
              ({activeTeachersCount} on duty)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Teaching staff registered in school</p>
        </div>

        {/* Metric 2: Absent Teachers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Absent Teachers
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                absentTeachersCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                absentTeachersCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {absentTeachersCount}
            </span>
            <span className="text-xs text-slate-500">today</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {absentTeachersCount === 0 ? 'Full attendance today' : 'Absence recorded for today'}
          </p>
        </div>

        {/* Metric 3: Relief Periods Required */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Relief Periods Required
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                totalReliefPeriodsRequired > 0
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalReliefPeriodsRequired}
            </span>
            <span className="text-xs text-slate-500">periods</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalReliefPeriodsRequired === 0
              ? 'No classes need coverage'
              : `${matchedPeriodsCount} matched, ${unresolvedPeriodsCount} pending`}
          </p>
        </div>

        {/* Metric 4: Daily Relief Plan Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Relief Status
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                unresolvedPeriodsCount > 0
                  ? 'bg-rose-50 text-rose-600'
                  : isConfirmed
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {unresolvedPeriodsCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isConfirmed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-lg font-bold ${
                unresolvedPeriodsCount > 0
                  ? 'text-rose-600'
                  : isConfirmed
                  ? 'text-emerald-700'
                  : 'text-slate-800'
              }`}
            >
              {unresolvedPeriodsCount > 0
                ? 'Needs Attention'
                : isConfirmed
                ? 'Confirmed & Ready'
                : totalReliefPeriodsRequired > 0
                ? 'Draft Pending'
                : 'No Relief Needed'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {unresolvedPeriodsCount > 0
              ? `${unresolvedPeriodsCount} period(s) have no free teacher`
              : isConfirmed
              ? 'Ready to print daily sheet'
              : 'Ready for substitute matching'}
          </p>
        </div>
      </div>

      {/* Alert banner if unresolved periods exist */}
      {unresolvedPeriodsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                ⚠ NO AVAILABLE RELIEF TEACHER FOR {unresolvedPeriodsCount} PERIOD(S) — INFORM PRINCIPAL
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                One or more teaching periods have no free teacher available in the master timetable. The Principal must be informed immediately to arrange special supervision.
              </p>
            </div>
          </div>
          <button
            id="dashboard-resolve-alert-btn"
            type="button"
            onClick={() => onNavigate('matcher')}
            className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 shrink-0 cursor-pointer"
          >
            Review in Matcher
          </button>
        </div>
      )}

      {/* Operational Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1: Absences */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-xs text-slate-400 font-medium">Daily Input</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Record Absences</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Log absent teachers for today by selecting whole-day or specific affected periods.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-medium text-slate-700 block mb-1">Today's Absences:</span>
              {todayAbsences.length === 0 ? (
                <span className="text-slate-500 italic">No teachers marked absent yet</span>
              ) : (
                <ul className="space-y-1 text-slate-700 font-medium">
                  {todayAbsences.map((a) => (
                    <li key={a.id} className="flex items-center justify-between">
                      <span>• {a.teacherName}</span>
                      <span className="text-[11px] text-slate-500">
                        {a.type === 'whole_day' ? 'Whole Day' : `${a.periods.length} periods`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            id="dashboard-step1-btn"
            type="button"
            onClick={() => onNavigate('absences')}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span>Manage Absences</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step 2: Matcher */}
        <div className="bg-white rounded-xl p-5 border border-indigo-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Matcher
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Substitute Matcher</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Examine the master timetable. Automatically find free teachers, match subject & grade affinity, and balance relief workload fairly.
            </p>
            <div className="mt-4 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900">
              <div className="flex justify-between items-center">
                <span>Relief Requirements:</span>
                <span className="font-bold">{totalReliefPeriodsRequired} periods</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>Currently Assigned:</span>
                <span className="font-bold text-emerald-700">{matchedPeriodsCount}</span>
              </div>
            </div>
          </div>
          <button
            id="dashboard-step2-btn"
            type="button"
            onClick={() => {
              if (todayAbsences.length > 0 && (!currentPlan || currentPlan.assignments.length === 0)) {
                onQuickMatch();
              }
              onNavigate('matcher');
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            <span>Run / View Matcher</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step 3: Print */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <span className="text-xs text-slate-400 font-medium">Finalize</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Print Relief Sheet</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Generate an official daily relief sheet for the staffroom notice board, relief teachers, and the Principal's desk.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    isConfirmed ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {isConfirmed ? '✓ Confirmed by Admin' : 'Unconfirmed Draft'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Formatted for clean A4 printing with official notes & signatures.
              </p>
            </div>
          </div>
          <button
            id="dashboard-step3-btn"
            type="button"
            onClick={() => onNavigate('print')}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Relief Sheet</span>
          </button>
        </div>
      </div>

      {/* Today's Relief Assignments Table Preview (if exists) */}
      {currentPlan && currentPlan.assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Today's Relief Schedule Preview
              </h3>
              <p className="text-xs text-slate-500">
                {currentPlan.assignments.length} relief assignment(s) scheduled for {formattedDate}
              </p>
            </div>
            <button
              id="dashboard-view-full-matcher-btn"
              type="button"
              onClick={() => onNavigate('matcher')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Results & Overrides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Absent Teacher</th>
                  <th className="py-3 px-4">Assigned Relief</th>
                  <th className="py-3 px-4">Status & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPlan.assignments.map((assignment) => {
                  const isNoRelief = assignment.status === 'no_relief';
                  return (
                    <tr
                      key={assignment.id}
                      className={isNoRelief ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs">
                          {assignment.period}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {assignment.class}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{assignment.subject}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {assignment.absentTeacherName}
                      </td>
                      <td className="py-3 px-4">
                        {isNoRelief ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            NO RELIEF AVAILABLE
                          </span>
                        ) : (
                          <span className="font-bold text-indigo-700">
                            {assignment.assignedTeacherName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs ${
                            isNoRelief ? 'font-bold text-amber-800' : 'text-slate-600'
                          }`}
                        >
                          {assignment.reason}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
