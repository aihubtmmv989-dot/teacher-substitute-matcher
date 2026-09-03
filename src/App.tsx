import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AbsenceManager } from './components/AbsenceManager';
import { SubstituteMatcher } from './components/SubstituteMatcher';
import { MasterTimetable } from './components/MasterTimetable';
import { PrintReliefSheet } from './components/PrintReliefSheet';
import { AdminSettings } from './components/AdminSettings';
import {
  loadTeachers,
  saveTeachers,
  loadSchedules,
  saveSchedules,
  loadAbsences,
  saveAbsences,
  loadConfirmedPlans,
  saveConfirmedPlans,
  loadSettings,
  saveSettings,
  resetToDefaults,
} from './utils/storage';
import { Teacher, TeacherSchedule, AbsenceRecord, DailyReliefPlan, SchoolSettings } from './types';

export default function App() {
  // Initialize date to today YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Persistent States
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadTeachers());
  const [schedules, setSchedules] = useState<Record<string, TeacherSchedule>>(() => loadSchedules());
  const [absences, setAbsences] = useState<AbsenceRecord[]>(() => loadAbsences());
  const [confirmedPlans, setConfirmedPlans] = useState<DailyReliefPlan[]>(() => loadConfirmedPlans());
  const [settings, setSettings] = useState<SchoolSettings>(() => loadSettings());

  // Current active daily plan for selectedDate
  const currentPlan = useMemo(() => {
    return confirmedPlans.find((p) => p.date === selectedDate) || null;
  }, [confirmedPlans, selectedDate]);

  // Sync teachers to storage
  const handleUpdateTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    saveTeachers(newTeachers);
  };

  // Sync schedules to storage
  const handleUpdateSchedules = (newSchedules: Record<string, TeacherSchedule>) => {
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
  };

  // Sync absences to storage
  const handleAddAbsence = (newAbsenceData: Omit<AbsenceRecord, 'id' | 'createdAt'>) => {
    const record: AbsenceRecord = {
      ...newAbsenceData,
      id: `abs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [record, ...absences];
    setAbsences(updated);
    saveAbsences(updated);
  };

  const handleDeleteAbsence = (absenceId: string) => {
    const updated = absences.filter((a) => a.id !== absenceId);
    setAbsences(updated);
    saveAbsences(updated);

    // If active plan depends on this, update plans
    const remainingDateAbsences = updated.filter((a) => a.date === selectedDate);
    if (remainingDateAbsences.length === 0) {
      const updatedPlans = confirmedPlans.filter((p) => p.date !== selectedDate);
      setConfirmedPlans(updatedPlans);
      saveConfirmedPlans(updatedPlans);
    }
  };

  // Save / Update daily relief plan
  const handleSavePlan = (plan: DailyReliefPlan) => {
    const exists = confirmedPlans.some((p) => p.date === plan.date);
    let updatedPlans: DailyReliefPlan[];
    if (exists) {
      updatedPlans = confirmedPlans.map((p) => (p.date === plan.date ? plan : p));
    } else {
      updatedPlans = [...confirmedPlans, plan];
    }
    setConfirmedPlans(updatedPlans);
    saveConfirmedPlans(updatedPlans);

    // If plan was just confirmed, update teacher cumulative relief counts
    if (plan.confirmed) {
      const countsToday: Record<string, number> = {};
      plan.assignments.forEach((a) => {
        if (a.assignedTeacherId) {
          countsToday[a.assignedTeacherId] = (countsToday[a.assignedTeacherId] || 0) + 1;
        }
      });

      const updatedTeachers = teachers.map((t) => ({
        ...t,
        totalCumulativeRelief: t.totalCumulativeRelief + (countsToday[t.id] || 0),
      }));
      handleUpdateTeachers(updatedTeachers);
    }
  };

  // Sync settings
  const handleUpdateSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Reset to default 5 teachers and timetable from prompt
  const handleResetDefaults = () => {
    const defaults = resetToDefaults();
    setTeachers(defaults.teachers);
    setSchedules(defaults.schedules);
  };

  // Format date display
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Counts for sidebar badges
  const todayAbsences = absences.filter((a) => a.date === todayStr);
  const unresolvedReliefToday = currentPlan
    ? currentPlan.assignments.filter((a) => a.status === 'no_relief').length
    : 0;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row text-slate-900 antialiased font-sans">
      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        absentCountToday={todayAbsences.length}
        unresolvedReliefCount={unresolvedReliefToday}
        isOpenMobile={isOpenMobile}
        onToggleMobile={() => setIsOpenMobile(!isOpenMobile)}
        schoolName={settings.schoolName}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-200">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <Dashboard
              todayDateStr={selectedDate}
              formattedDate={formattedDate}
              teachers={teachers}
              absences={absences}
              currentPlan={currentPlan}
              onNavigate={setCurrentTab}
              onQuickMatch={() => setCurrentTab('matcher')}
            />
          )}

          {currentTab === 'absences' && (
            <AbsenceManager
              teachers={teachers}
              schedules={schedules}
              absences={absences}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onAddAbsence={handleAddAbsence}
              onDeleteAbsence={handleDeleteAbsence}
              onRunMatcherForDate={(date) => {
                setSelectedDate(date);
                setCurrentTab('matcher');
              }}
            />
          )}

          {currentTab === 'matcher' && (
            <SubstituteMatcher
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              teachers={teachers}
              schedules={schedules}
              absences={absences}
              currentPlan={currentPlan}
              onSavePlan={handleSavePlan}
              onNavigateToPrint={() => setCurrentTab('print')}
              schoolName={settings.schoolName}
            />
          )}

          {currentTab === 'timetable' && (
            <MasterTimetable
              teachers={teachers}
              schedules={schedules}
              onNavigateToAdmin={() => setCurrentTab('admin')}
            />
          )}

          {currentTab === 'print' && (
            <PrintReliefSheet
              currentPlan={currentPlan}
              selectedDate={selectedDate}
              formattedDate={formattedDate}
              teachers={teachers}
              absences={absences}
              schoolName={settings.schoolName}
              principalName={settings.principalName}
              academicTerm={settings.academicTerm}
              academicYear={settings.academicYear}
            />
          )}

          {currentTab === 'admin' && (
            <AdminSettings
              teachers={teachers}
              schedules={schedules}
              settings={settings}
              onUpdateTeachers={handleUpdateTeachers}
              onUpdateSchedules={handleUpdateSchedules}
              onUpdateSettings={handleUpdateSettings}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </div>
      </main>
    </div>
  );
}
