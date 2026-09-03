import React, { useState } from 'react';
import {
  UserX,
  Calendar,
  Clock,
  Trash2,
  Sparkles,
  PlusCircle,
  AlertCircle,
  Check,
  FileText,
} from 'lucide-react';
import { Teacher, TeacherSchedule, PeriodId, AbsenceRecord } from '../types';
import { PERIOD_IDS, PERIOD_TIMES } from '../data/initialData';

interface AbsenceManagerProps {
  teachers: Teacher[];
  schedules: Record<string, TeacherSchedule>;
  absences: AbsenceRecord[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddAbsence: (absence: Omit<AbsenceRecord, 'id' | 'createdAt'>) => void;
  onDeleteAbsence: (absenceId: string) => void;
  onRunMatcherForDate: (date: string) => void;
}

export const AbsenceManager: React.FC<AbsenceManagerProps> = ({
  teachers,
  schedules,
  absences,
  selectedDate,
  onDateChange,
  onAddAbsence,
  onDeleteAbsence,
  onRunMatcherForDate,
}) => {
  const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id || '');
  const [absenceType, setAbsenceType] = useState<'whole_day' | 'specific_periods'>('whole_day');
  const [selectedPeriods, setSelectedPeriods] = useState<PeriodId[]>([...PERIOD_IDS]);
  const [reason, setReason] = useState<string>('Sick Leave');
  const [customReason, setCustomReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedTeacher = teachers.find((t) => t.id === teacherId);
  const teacherSchedule = teacherId ? schedules[teacherId] : null;

  // Absences for currently active date
  const absencesForDate = absences.filter((a) => a.date === selectedDate);

  const handlePeriodToggle = (period: PeriodId) => {
    setSelectedPeriods((prev) =>
      prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period]
    );
  };

  const handleSelectAllPeriods = () => {
    setSelectedPeriods([...PERIOD_IDS]);
  };

  const handleClearPeriods = () => {
    setSelectedPeriods([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!teacherId) {
      setFormError('Please select a teacher.');
      return;
    }

    if (absenceType === 'specific_periods' && selectedPeriods.length === 0) {
      setFormError('Please select at least one period for specific periods absence.');
      return;
    }

    // Check if this teacher is already marked absent on this date
    const alreadyAbsent = absencesForDate.find((a) => a.teacherId === teacherId);
    if (alreadyAbsent) {
      setFormError(`${selectedTeacher?.name} is already recorded as absent on ${selectedDate}.`);
      return;
    }

    const periodsToRecord: PeriodId[] =
      absenceType === 'whole_day' ? [...PERIOD_IDS] : [...selectedPeriods];

    const finalReason = reason === 'Other' ? customReason.trim() || 'Unspecified Reason' : reason;

    onAddAbsence({
      teacherId,
      teacherName: selectedTeacher?.name || 'Unknown Teacher',
      date: selectedDate,
      type: absenceType,
      periods: periodsToRecord,
      reason: finalReason,
    });

    setSuccessMessage(`Marked ${selectedTeacher?.name} absent for ${selectedDate}.`);
    // Reset specific periods to all
    setSelectedPeriods([...PERIOD_IDS]);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
            <UserX className="w-3.5 h-3.5" />
            <span>Staff Absence Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Mark Teacher Absent</h1>
          <p className="text-sm text-slate-600 mt-1">
            Log whole-day or period-specific teacher absences to calculate relief requirements.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          <span className="text-xs font-medium text-slate-600">Date:</span>
          <input
            id="absence-date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Grid: Form on left, Today's list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Absence Form */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              New Teacher Absence Record
            </h2>
            <span className="text-xs text-slate-400">Office Staff Form</span>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Select Teacher */}
            <div>
              <label htmlFor="absence-teacher-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Teacher <span className="text-rose-500">*</span>
              </label>
              <select
                id="absence-teacher-select"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.primarySubjects.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Absence Coverage Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Periods Affected <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="absence-type-whole-day-btn"
                  onClick={() => {
                    setAbsenceType('whole_day');
                    setSelectedPeriods([...PERIOD_IDS]);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    absenceType === 'whole_day'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm">Whole Day</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Periods P1 through P8 (All day)
                  </div>
                </button>

                <button
                  type="button"
                  id="absence-type-specific-periods-btn"
                  onClick={() => setAbsenceType('specific_periods')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    absenceType === 'specific_periods'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm">Specific Periods</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Select individual teaching periods
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Specific Periods Selector & Timetable Preview */}
            {absenceType === 'specific_periods' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Select Affected Periods ({selectedPeriods.length} selected):
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPeriods}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearPeriods}
                      className="text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERIOD_IDS.map((p) => {
                    const slot = teacherSchedule?.periods[p];
                    const isSelected = selectedPeriods.includes(p);
                    const isFreeSlot = slot?.isFree || slot?.class === 'FREE';

                    return (
                      <button
                        key={p}
                        type="button"
                        id={`period-toggle-${p}`}
                        onClick={() => handlePeriodToggle(p)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{p}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="text-[11px] mt-1 font-semibold truncate">
                          {isFreeSlot ? (
                            <span className="text-emerald-700 italic">FREE</span>
                          ) : (
                            <span>
                              {slot?.class} {slot?.subject}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {PERIOD_TIMES[p]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Teacher's Current Daily Classes Preview */}
            {selectedTeacher && teacherSchedule && (
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  {selectedTeacher.name}'s Scheduled Classes Today:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PERIOD_IDS.map((p) => {
                    const slot = teacherSchedule.periods[p];
                    const isFree = slot.isFree || slot.class === 'FREE';
                    const isPeriodIncluded =
                      absenceType === 'whole_day' || selectedPeriods.includes(p);

                    return (
                      <div
                        key={p}
                        className={`px-2 py-1 rounded text-xs border ${
                          isFree
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : isPeriodIncluded
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                        title={`${p}: ${slot.class} ${slot.subject}`}
                      >
                        <span className="font-bold mr-1">{p}:</span>
                        {isFree ? 'FREE' : `${slot.class} ${slot.subject}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Reason */}
            <div>
              <label htmlFor="absence-reason-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Absence Reason
              </label>
              <select
                id="absence-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Sick Leave">Sick Leave (Medical)</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Official Duty / Training">Official Duty / Ministry Training</option>
                <option value="Examination Duty">Examination Duty</option>
                <option value="Bereavement / Family Emergency">Family Emergency</option>
                <option value="Other">Other (Specify below)</option>
              </select>

              {reason === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter specific reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2 w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                />
              )}
            </div>

            {/* Submit Button */}
            <button
              id="absence-submit-btn"
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              <span>Record Teacher Absence</span>
            </button>
          </form>
        </div>

        {/* Right side: Recorded absences for selected date */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Absences for {selectedDate}
                </h3>
                <p className="text-xs text-slate-500">
                  {absencesForDate.length} teacher(s) recorded absent
                </p>
              </div>
              {absencesForDate.length > 0 && (
                <button
                  id="absence-find-substitutes-quick-btn"
                  type="button"
                  onClick={() => onRunMatcherForDate(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Find Substitutes</span>
                </button>
              )}
            </div>

            {absencesForDate.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <UserX className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-600">No absences recorded</p>
                <p className="text-xs text-slate-400 mt-1">
                  All teachers are present on {selectedDate}. Use the form to record an absence.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-3">
                {absencesForDate.map((absence) => {
                  const teacher = teachers.find((t) => t.id === absence.teacherId);
                  const sched = schedules[absence.teacherId];
                  const teachingPeriodsNeedingRelief = absence.periods.filter((p) => {
                    const slot = sched?.periods[p];
                    return slot && !slot.isFree && slot.class !== 'FREE';
                  });

                  return (
                    <div key={absence.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {absence.teacherName}
                          </h4>
                          <span className="text-xs text-slate-500 block">
                            {teacher?.primarySubjects.join(', ')}
                          </span>
                        </div>
                        <button
                          id={`delete-absence-btn-${absence.id}`}
                          type="button"
                          onClick={() => onDeleteAbsence(absence.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove Absence"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">
                            {absence.type === 'whole_day'
                              ? 'Whole Day (Periods P1 - P8)'
                              : `Specific: ${absence.periods.join(', ')}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{absence.reason}</span>
                        </div>
                        <div className="mt-2 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block">
                          Requires relief for {teachingPeriodsNeedingRelief.length} class periods
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guide for School Office Staff */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Staff Substitution Guidelines
            </h4>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed">
              <li>Marking a teacher absent does not modify their master timetable.</li>
              <li>Free periods in an absent teacher's schedule do not require relief.</li>
              <li>Click <strong>Find Substitutes</strong> to match free colleagues with matching subjects.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
