import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  ChevronDown,
  RotateCcw,
  Check,
  Info,
  Scale,
  Bot,
  UserCheck,
} from 'lucide-react';
import {
  Teacher,
  TeacherSchedule,
  AbsenceRecord,
  ReliefAssignment,
  DailyReliefPlan,
  PeriodId,
} from '../types';
import { matchSubstitutesDeterministic } from '../utils/matcher';
import { PERIOD_TIMES } from '../data/initialData';

interface SubstituteMatcherProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  teachers: Teacher[];
  schedules: Record<string, TeacherSchedule>;
  absences: AbsenceRecord[];
  currentPlan: DailyReliefPlan | null;
  onSavePlan: (plan: DailyReliefPlan) => void;
  onNavigateToPrint: () => void;
  schoolName: string;
}

export const SubstituteMatcher: React.FC<SubstituteMatcherProps> = ({
  selectedDate,
  onDateChange,
  teachers,
  schedules,
  absences,
  currentPlan,
  onSavePlan,
  onNavigateToPrint,
  schoolName,
}) => {
  const [isMatching, setIsMatching] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  // Filter absences for active date
  const dateAbsences = absences.filter((a) => a.date === selectedDate);

  // Active assignments (either from currentPlan if it matches active date, or empty)
  const assignments: ReliefAssignment[] =
    currentPlan && currentPlan.date === selectedDate ? currentPlan.assignments : [];

  const isConfirmed = Boolean(currentPlan && currentPlan.date === selectedDate && currentPlan.confirmed);

  // Calculate workload summary from assignments
  // Teacher | Relief Periods (Today)
  const workloadMap: Record<string, number> = {};
  teachers.forEach((t) => {
    workloadMap[t.id] = 0;
  });

  assignments.forEach((a) => {
    if (a.assignedTeacherId && workloadMap[a.assignedTeacherId] !== undefined) {
      workloadMap[a.assignedTeacherId] += 1;
    }
  });

  // Sort teachers by relief periods assigned today descending (Requirement 8)
  const workloadList = teachers
    .map((t) => ({
      teacherId: t.id,
      name: t.name,
      subjects: t.primarySubjects,
      isAvailable: t.isAvailable,
      todayRelief: workloadMap[t.id] || 0,
      cumulativeRelief: t.totalCumulativeRelief + (isConfirmed ? 0 : workloadMap[t.id] || 0),
    }))
    .sort((a, b) => b.todayRelief - a.todayRelief || b.cumulativeRelief - a.cumulativeRelief);

  const unresolvedCount = assignments.filter((a) => a.status === 'no_relief').length;
  const matchedCount = assignments.filter((a) => a.status === 'matched').length;

  // Run the matching algorithm
  const handleFindSubstitutes = async () => {
    if (dateAbsences.length === 0) {
      alert(`No absences recorded for ${selectedDate}. Please mark at least one teacher absent first.`);
      return;
    }

    setIsMatching(true);
    setAiStatusMessage(null);
    setConfirmationNotice(null);

    // 1. Step 1: Run rigorous deterministic match based on timetable
    const deterministicAssignments = matchSubstitutesDeterministic(
      dateAbsences,
      teachers,
      schedules
    );

    let finalAssignments = deterministicAssignments;

    // 2. Step 2: If AI ranking is enabled, call server API /api/substitute-ai
    if (useAI && deterministicAssignments.some((a) => a.status === 'matched')) {
      try {
        setAiStatusMessage('Connecting to Gemini AI for pedagogical ranking and reason generation...');
        const response = await fetch('/api/substitute-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignments: deterministicAssignments,
            teachers,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.assignments) {
            finalAssignments = data.assignments;
            if (data.success) {
              setAiStatusMessage('Gemini AI enriched substitute rationale & workload ranking.');
            } else {
              setAiStatusMessage('Using deterministic timetable matches.');
            }
          }
        }
      } catch (err) {
        console.warn('AI matching fallback to deterministic', err);
        setAiStatusMessage('Fallback to deterministic timetable rules.');
      }
    }

    // Save as draft plan
    const newPlan: DailyReliefPlan = {
      id: `plan-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      absentTeacherIds: dateAbsences.map((a) => a.teacherId),
      assignments: finalAssignments,
      confirmed: false,
      schoolName,
    };

    onSavePlan(newPlan);
    setIsMatching(false);
  };

  // Manual override handler for a specific period
  const handleManualOverride = (assignmentId: string, newTeacherId: string) => {
    if (!currentPlan) return;

    const newTeacher = teachers.find((t) => t.id === newTeacherId);
    if (!newTeacher) return;

    const updatedAssignments = currentPlan.assignments.map((a) => {
      if (a.id === assignmentId) {
        return {
          ...a,
          assignedTeacherId: newTeacher.id,
          assignedTeacherName: newTeacher.name,
          status: 'matched' as const,
          reason: `Manual administrative assignment: ${newTeacher.name} (Available during ${a.period})`,
          isManualOverride: true,
        };
      }
      return a;
    });

    onSavePlan({
      ...currentPlan,
      assignments: updatedAssignments,
      confirmed: false, // Reset confirmation if modified
    });
    setEditingAssignmentId(null);
  };

  // Confirm Assignments (Requirement 9)
  const handleConfirmAssignments = () => {
    if (!currentPlan || currentPlan.assignments.length === 0) return;

    const updatedPlan: DailyReliefPlan = {
      ...currentPlan,
      confirmed: true,
      confirmedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSavePlan(updatedPlan);
    setConfirmationNotice('Relief assignments confirmed and locked for the school day!');
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Relief Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Substitute Matcher</h1>
          <p className="text-sm text-slate-600 mt-1">
            Analyze master timetable free periods, enforce subject & grade affinity, and distribute relief workload fairly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-slate-600">Date:</span>
            <input
              id="matcher-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* AI Helper Toggle (Requirement 14) */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Rationale & Ranking</span>
          </label>

          {/* Find Substitutes Button (Requirement 5) */}
          <button
            id="find-substitutes-btn"
            type="button"
            onClick={handleFindSubstitutes}
            disabled={isMatching || dateAbsences.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer ${
              dateAbsences.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isMatching ? 'animate-spin' : ''}`} />
            <span>{isMatching ? 'Matching Timetable...' : 'Find Substitutes'}</span>
          </button>
        </div>
      </div>

      {/* Date Absences Notice Banner */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Recorded Absences for {selectedDate}:</span>
          {dateAbsences.length === 0 ? (
            <span className="text-slate-500 italic">No teachers marked absent. Mark an absence to calculate relief.</span>
          ) : (
            <span className="font-semibold text-amber-700">
              {dateAbsences.map((a) => a.teacherName).join(', ')} ({dateAbsences.length} absent)
            </span>
          )}
        </div>
        {aiStatusMessage && (
          <div className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>{aiStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Confirmation Banner */}
      {confirmationNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{confirmationNotice}</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToPrint}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Relief Sheet</span>
          </button>
        </div>
      )}

      {/* Requirement 6: NO AVAILABLE TEACHER ALERT */}
      {unresolvedCount > 0 && (
        <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-amber-900">
                ⚠ NO AVAILABLE RELIEF TEACHER — INFORM PRINCIPAL
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                For {unresolvedCount} required class period(s), all other teachers are already actively teaching another class or absent.
                Standard automatic coverage is impossible. Please notify the School Principal to arrange combined classes or emergency administrative supervision.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToPrint}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer"
          >
            Print Notice for Principal
          </button>
        </div>
      )}

      {/* RESULTS SECTION (Requirement 7) */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">
                  Daily Relief Schedule
                </h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isConfirmed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConfirmed ? '✓ Confirmed by Admin' : 'Draft / Unconfirmed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {assignments.length} period(s) requiring relief ({matchedCount} assigned, {unresolvedCount} unassigned)
              </p>
            </div>

            {/* Action Buttons: Confirm Assignments & Print */}
            <div className="flex items-center gap-2.5">
              {!isConfirmed && (
                <button
                  id="confirm-assignments-btn"
                  type="button"
                  onClick={handleConfirmAssignments}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Assignments</span>
                </button>
              )}

              <button
                id="print-from-matcher-btn"
                type="button"
                onClick={onNavigateToPrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
              </button>
            </div>
          </div>

          {/* Results Table (Requirement 7: Period | Class | Subject | Relief Teacher | Reason) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-20">Period</th>
                  <th className="py-3 px-4 w-24">Class</th>
                  <th className="py-3 px-4 w-32">Subject</th>
                  <th className="py-3 px-4">Absent Teacher</th>
                  <th className="py-3 px-4">Relief Teacher</th>
                  <th className="py-3 px-4">Reason / Rationale</th>
                  <th className="py-3 px-4 text-right">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => {
                  const isNoRelief = assignment.status === 'no_relief';
                  const isEditing = editingAssignmentId === assignment.id;

                  // Find eligible free alternatives for manual override
                  const schedPeriod = assignment.period;
                  const candidateOptions = teachers.filter((t) => {
                    if (t.id === assignment.absentTeacherId) return false;
                    if (!t.isAvailable) return false;
                    // Check if teacher is free in master timetable
                    const candSched = schedules[t.id];
                    const candSlot = candSched?.periods[schedPeriod];
                    return candSlot && (candSlot.isFree || candSlot.class === 'FREE');
                  });

                  return (
                    <tr
                      key={assignment.id}
                      className={
                        isNoRelief
                          ? 'bg-amber-50/50'
                          : assignment.isManualOverride
                          ? 'bg-blue-50/30'
                          : 'hover:bg-slate-50/60'
                      }
                    >
                      {/* Period */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-xs px-2.5 py-1 rounded bg-slate-800 text-white">
                          {assignment.period}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {PERIOD_TIMES[assignment.period]}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {assignment.class}
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {assignment.subject}
                      </td>

                      {/* Absent Teacher */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-900">{assignment.absentTeacherName}</span>
                      </td>

                      {/* Relief Teacher */}
                      <td className="py-3.5 px-4">
                        {isNoRelief ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-black text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                            <span>NO AVAILABLE RELIEF</span>
                          </div>
                        ) : isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              id={`override-select-${assignment.id}`}
                              defaultValue={assignment.assignedTeacherId || ''}
                              onChange={(e) => handleManualOverride(assignment.id, e.target.value)}
                              className="text-xs font-semibold rounded border border-indigo-400 bg-white px-2 py-1 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="" disabled>
                                Select free teacher...
                              </option>
                              {candidateOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name} ({opt.primarySubjects.join(', ')})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setEditingAssignmentId(null)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 px-1 py-0.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-sm">
                              {assignment.assignedTeacherName}
                            </span>
                            {assignment.isManualOverride && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                                Override
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span
                          className={`text-xs leading-relaxed block ${
                            isNoRelief
                              ? 'font-bold text-amber-900'
                              : 'text-slate-600'
                          }`}
                        >
                          {assignment.reason}
                        </span>
                      </td>

                      {/* Manual Override Control */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isEditing && candidateOptions.length > 0 && (
                          <button
                            id={`edit-substitute-btn-${assignment.id}`}
                            type="button"
                            onClick={() => setEditingAssignmentId(assignment.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 cursor-pointer"
                          >
                            Change
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAIRNESS & WORKLOAD SUMMARY SECTION (Requirement 8) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              Relief Workload Distribution & Fairness
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks periods assigned per teacher to prevent overburdening any individual staff member.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            Sorted by Assigned Relief Duties
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Teacher</th>
                <th className="py-2.5 px-4">Subject Specialty</th>
                <th className="py-2.5 px-4">Availability</th>
                <th className="py-2.5 px-4 text-center">Relief Periods (Today)</th>
                <th className="py-2.5 px-4 text-center">Cumulative Duties</th>
                <th className="py-2.5 px-4">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workloadList.map((item) => {
                const isAbsentToday = dateAbsences.some((a) => a.teacherId === item.teacherId);
                return (
                  <tr key={item.teacherId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.name}
                      {isAbsentToday && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                          Absent Today
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.subjects.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      {item.isAvailable && !isAbsentToday ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Available
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unavailable / On Leave</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full ${
                          item.todayRelief === 0
                            ? 'bg-slate-100 text-slate-500 font-normal'
                            : item.todayRelief === 1
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900 font-bold'
                        }`}
                      >
                        {item.todayRelief}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-medium">
                      {item.cumulativeRelief}
                    </td>
                    <td className="py-3 px-4">
                      {item.todayRelief === 0 ? (
                        <span className="text-slate-500 text-xs">No relief assigned today</span>
                      ) : item.todayRelief === 1 ? (
                        <span className="text-emerald-700 font-semibold text-xs">Fair (1 period)</span>
                      ) : (
                        <span className="text-amber-700 font-bold text-xs">High Load ({item.todayRelief} periods)</span>
                      )}
                    </td>
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
