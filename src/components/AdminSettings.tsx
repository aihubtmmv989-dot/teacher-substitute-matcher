import React, { useState } from 'react';
import {
  Settings,
  Users,
  Calendar,
  PlusCircle,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  Building,
  UserCheck,
  UserX,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Teacher, TeacherSchedule, PeriodId, SchoolSettings } from '../types';
import { PERIOD_IDS, PERIOD_TIMES } from '../data/initialData';

interface AdminSettingsProps {
  teachers: Teacher[];
  schedules: Record<string, TeacherSchedule>;
  settings: SchoolSettings;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateSchedules: (schedules: Record<string, TeacherSchedule>) => void;
  onUpdateSettings: (settings: SchoolSettings) => void;
  onResetDefaults: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  teachers,
  schedules,
  settings,
  onUpdateTeachers,
  onUpdateSchedules,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'timetable' | 'school'>('teachers');

  // Teacher Form state
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState('');
  const [teacherGrades, setTeacherGrades] = useState('');
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timetable Edit state
  const [selectedTimetableTeacherId, setSelectedTimetableTeacherId] = useState<string>(
    teachers[0]?.id || ''
  );
  const [timetableSaveMsg, setTimetableSaveMsg] = useState<string | null>(null);

  // School profile state
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [principalName, setPrincipalName] = useState(settings.principalName);
  const [academicTerm, setAcademicTerm] = useState(settings.academicTerm);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [schoolSaveMsg, setSchoolSaveMsg] = useState<string | null>(null);

  // Handle Add or Edit Teacher
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      setFormMsg({ type: 'error', text: 'Teacher name is required.' });
      return;
    }

    const subjectsArray = teacherSubjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const gradesArray = teacherGrades
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    if (subjectsArray.length === 0) {
      setFormMsg({ type: 'error', text: 'Please provide at least one subject.' });
      return;
    }

    if (editingTeacherId) {
      // Update existing teacher
      const updated = teachers.map((t) =>
        t.id === editingTeacherId
          ? {
              ...t,
              name: teacherName.trim(),
              primarySubjects: subjectsArray,
              gradesTaught: gradesArray,
            }
          : t
      );
      onUpdateTeachers(updated);
      setFormMsg({ type: 'success', text: `Updated ${teacherName} successfully.` });
    } else {
      // Create new teacher
      const newId = `t-${Date.now().toString(36)}`;
      const newTeacher: Teacher = {
        id: newId,
        name: teacherName.trim(),
        primarySubjects: subjectsArray,
        gradesTaught: gradesArray.length > 0 ? gradesArray : ['6', '7', '8', '9', '10'],
        isAvailable: true,
        totalCumulativeRelief: 0,
      };

      // Create default free timetable for new teacher
      const defaultPeriods: Record<PeriodId, { isFree: boolean; class: string; subject: string }> = {
        P1: { isFree: true, class: 'FREE', subject: 'FREE' },
        P2: { isFree: true, class: 'FREE', subject: 'FREE' },
        P3: { isFree: true, class: 'FREE', subject: 'FREE' },
        P4: { isFree: true, class: 'FREE', subject: 'FREE' },
        P5: { isFree: true, class: 'FREE', subject: 'FREE' },
        P6: { isFree: true, class: 'FREE', subject: 'FREE' },
        P7: { isFree: true, class: 'FREE', subject: 'FREE' },
        P8: { isFree: true, class: 'FREE', subject: 'FREE' },
      };

      onUpdateTeachers([...teachers, newTeacher]);
      onUpdateSchedules({
        ...schedules,
        [newId]: { teacherId: newId, periods: defaultPeriods },
      });

      setFormMsg({ type: 'success', text: `Added ${teacherName} to teacher database.` });
    }

    // Reset form
    setEditingTeacherId(null);
    setTeacherName('');
    setTeacherSubjects('');
    setTeacherGrades('');
    setTimeout(() => setFormMsg(null), 3500);
  };

  const handleStartEditTeacher = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setTeacherName(teacher.name);
    setTeacherSubjects(teacher.primarySubjects.join(', '));
    setTeacherGrades(teacher.gradesTaught.join(', '));
  };

  const handleCancelEdit = () => {
    setEditingTeacherId(null);
    setTeacherName('');
    setTeacherSubjects('');
    setTeacherGrades('');
    setFormMsg(null);
  };

  // Toggle availability (Requirement 11: Mark teachers unavailable)
  const handleToggleAvailability = (teacherId: string) => {
    const updated = teachers.map((t) =>
      t.id === teacherId ? { ...t, isAvailable: !t.isAvailable } : t
    );
    onUpdateTeachers(updated);
  };

  // Remove teacher
  const handleRemoveTeacher = (teacherId: string, name: string) => {
    if (teachers.length <= 1) {
      alert('Cannot delete the last remaining teacher.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${name} from the school database?`)) {
      const updatedTeachers = teachers.filter((t) => t.id !== teacherId);
      const updatedSchedules = { ...schedules };
      delete updatedSchedules[teacherId];

      onUpdateTeachers(updatedTeachers);
      onUpdateSchedules(updatedSchedules);

      if (selectedTimetableTeacherId === teacherId) {
        setSelectedTimetableTeacherId(updatedTeachers[0]?.id || '');
      }
    }
  };

  // Timetable Slot update
  const handlePeriodSlotChange = (
    period: PeriodId,
    field: 'class' | 'subject' | 'isFree',
    value: any
  ) => {
    const currentSchedule = schedules[selectedTimetableTeacherId];
    if (!currentSchedule) return;

    const slot = { ...currentSchedule.periods[period] };

    if (field === 'isFree') {
      slot.isFree = value;
      if (value) {
        slot.class = 'FREE';
        slot.subject = 'FREE';
      } else {
        if (slot.class === 'FREE') slot.class = '9A';
        if (slot.subject === 'FREE') {
          const teach = teachers.find((t) => t.id === selectedTimetableTeacherId);
          slot.subject = teach?.primarySubjects[0] || 'General';
        }
      }
    } else if (field === 'class') {
      slot.class = value;
      if (value.toUpperCase() === 'FREE') {
        slot.isFree = true;
        slot.subject = 'FREE';
      } else {
        slot.isFree = false;
      }
    } else if (field === 'subject') {
      slot.subject = value;
      if (value.toUpperCase() === 'FREE') {
        slot.isFree = true;
        slot.class = 'FREE';
      } else {
        slot.isFree = false;
      }
    }

    const updatedPeriods = {
      ...currentSchedule.periods,
      [period]: slot,
    };

    onUpdateSchedules({
      ...schedules,
      [selectedTimetableTeacherId]: {
        ...currentSchedule,
        periods: updatedPeriods,
      },
    });

    setTimetableSaveMsg('Timetable changes saved automatically.');
    setTimeout(() => setTimetableSaveMsg(null), 2500);
  };

  // Save school profile
  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      schoolName,
      principalName,
      academicTerm,
      academicYear,
    });
    setSchoolSaveMsg('School profile settings updated successfully.');
    setTimeout(() => setSchoolSaveMsg(null), 3000);
  };

  const activeTeacherSchedule = schedules[selectedTimetableTeacherId];
  const activeTimetableTeacher = teachers.find((t) => t.id === selectedTimetableTeacherId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>System Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin & Timetable Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure teachers, edit period timetable allocations, set availability, and manage school details.
          </p>
        </div>

        <button
          id="reset-defaults-btn"
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Reset to initial 5 teachers and default timetable from user prompt? Any custom edits will be reverted.'
              )
            ) {
              onResetDefaults();
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default Timetable</span>
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('teachers')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'teachers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teacher Directory ({teachers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('timetable')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'timetable'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Timetable Period Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('school')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'school'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>School Profile</span>
        </button>
      </div>

      {/* SUBTAB 1: TEACHER DIRECTORY */}
      {activeSubTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add / Edit Form */}
          <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs h-fit">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              {editingTeacherId ? <Edit2 className="w-4 h-4 text-indigo-600" /> : <PlusCircle className="w-4 h-4 text-indigo-600" />}
              {editingTeacherId ? 'Edit Teacher Details' : 'Add New Teacher'}
            </h3>

            {formMsg && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teacher Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admin-teacher-name"
                  type="text"
                  placeholder="e.g. Mr. Bandara AMAI"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subjects Taught (comma separated) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admin-teacher-subjects"
                  type="text"
                  placeholder="e.g. English, Literature"
                  value={teacherSubjects}
                  onChange={(e) => setTeacherSubjects(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Used by the matcher for subject domain affinity.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Grades Taught (comma separated)
                </label>
                <input
                  id="admin-teacher-grades"
                  type="text"
                  placeholder="e.g. 6, 7, 9, 10, 13"
                  value={teacherGrades}
                  onChange={(e) => setTeacherGrades(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  e.g. 6, 7, 8, 9, 10, 11, 12, 13
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  id="admin-save-teacher-btn"
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  {editingTeacherId ? 'Save Updates' : 'Add Teacher'}
                </button>
                {editingTeacherId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2.5 px-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Teachers List Table */}
          <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-3">
              Registered Teaching Staff ({teachers.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Toggle availability status to temporarily exclude a teacher from relief assignments (e.g. during workshops or exam invigilation).
            </p>

            <div className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                      {t.isAvailable ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                          Active Duty
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <strong>Subjects:</strong> {t.primarySubjects.join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Grades: {t.gradesTaught.join(', ')} • Cumulative Relief: {t.totalCumulativeRelief}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`toggle-avail-btn-${t.id}`}
                      type="button"
                      onClick={() => handleToggleAvailability(t.id)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        t.isAvailable
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {t.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </button>

                    <button
                      id={`edit-teacher-btn-${t.id}`}
                      type="button"
                      onClick={() => handleStartEditTeacher(t)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 cursor-pointer"
                      title="Edit Teacher"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      id={`delete-teacher-btn-${t.id}`}
                      type="button"
                      onClick={() => handleRemoveTeacher(t.id, t.name)}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete Teacher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TIMETABLE PERIOD EDITOR */}
      {activeSubTab === 'timetable' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Edit Timetable Periods
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modify period allocations, change teaching classes, or mark periods as FREE.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Select Teacher:</label>
              <select
                id="admin-timetable-select-teacher"
                value={selectedTimetableTeacherId}
                onChange={(e) => setSelectedTimetableTeacherId(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {timetableSaveMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{timetableSaveMsg}</span>
            </div>
          )}

          {activeTimetableTeacher && activeTeacherSchedule && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Period Allocations for {activeTimetableTeacher.name}</span>
                <span className="text-slate-400 font-normal">Changes save immediately to browser storage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PERIOD_IDS.map((p) => {
                  const slot = activeTeacherSchedule.periods[p];
                  const isFree = slot?.isFree || slot?.class === 'FREE';

                  return (
                    <div
                      key={p}
                      className={`p-4 rounded-xl border transition-all ${
                        isFree
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-white">
                          {p}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {PERIOD_TIMES[p]}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-600">Status:</label>
                          <button
                            type="button"
                            onClick={() => handlePeriodSlotChange(p, 'isFree', !isFree)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                              isFree
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                            }`}
                          >
                            {isFree ? 'FREE Period' : 'Class Period'}
                          </button>
                        </div>

                        {!isFree && (
                          <>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                                Class / Section:
                              </label>
                              <input
                                type="text"
                                value={slot.class}
                                onChange={(e) =>
                                  handlePeriodSlotChange(p, 'class', e.target.value)
                                }
                                placeholder="e.g. 9A"
                                className="w-full text-xs font-bold rounded border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                                Subject:
                              </label>
                              <input
                                type="text"
                                value={slot.subject}
                                onChange={(e) =>
                                  handlePeriodSlotChange(p, 'subject', e.target.value)
                                }
                                placeholder="e.g. English"
                                className="w-full text-xs rounded border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: SCHOOL PROFILE */}
      {activeSubTab === 'school' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 text-base mb-1">
            School & Institutional Profile
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Appears on the printed daily relief sheets and administrative reports.
          </p>

          {schoolSaveMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{schoolSaveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSchoolSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                School Name
              </label>
              <input
                id="admin-school-name"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Principal's Name & Title
              </label>
              <input
                id="admin-principal-name"
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Term
                </label>
                <input
                  type="text"
                  value={academicTerm}
                  onChange={(e) => setAcademicTerm(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <button
              id="admin-save-school-btn"
              type="submit"
              className="py-2.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save School Profile</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
