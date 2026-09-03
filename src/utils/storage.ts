import { Teacher, TeacherSchedule, AbsenceRecord, DailyReliefPlan, SchoolSettings } from '../types';
import { INITIAL_TEACHERS, INITIAL_SCHEDULES, DEFAULT_SCHOOL_SETTINGS } from '../data/initialData';

const KEYS = {
  TEACHERS: 'tsm_teachers_v1',
  SCHEDULES: 'tsm_schedules_v1',
  ABSENCES: 'tsm_absences_v1',
  CONFIRMED_PLANS: 'tsm_confirmed_plans_v1',
  SETTINGS: 'tsm_settings_v1',
};

export function loadTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(KEYS.TEACHERS);
    if (!raw) {
      saveTeachers(INITIAL_TEACHERS);
      return INITIAL_TEACHERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading teachers from storage', e);
    return INITIAL_TEACHERS;
  }
}

export function saveTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.error('Error saving teachers to storage', e);
  }
}

export function loadSchedules(): Record<string, TeacherSchedule> {
  try {
    const raw = localStorage.getItem(KEYS.SCHEDULES);
    if (!raw) {
      saveSchedules(INITIAL_SCHEDULES);
      return INITIAL_SCHEDULES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading schedules from storage', e);
    return INITIAL_SCHEDULES;
  }
}

export function saveSchedules(schedules: Record<string, TeacherSchedule>): void {
  try {
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
  } catch (e) {
    console.error('Error saving schedules to storage', e);
  }
}

export function loadAbsences(): AbsenceRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.ABSENCES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading absences from storage', e);
    return [];
  }
}

export function saveAbsences(absences: AbsenceRecord[]): void {
  try {
    localStorage.setItem(KEYS.ABSENCES, JSON.stringify(absences));
  } catch (e) {
    console.error('Error saving absences to storage', e);
  }
}

export function loadConfirmedPlans(): DailyReliefPlan[] {
  try {
    const raw = localStorage.getItem(KEYS.CONFIRMED_PLANS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading plans from storage', e);
    return [];
  }
}

export function saveConfirmedPlans(plans: DailyReliefPlan[]): void {
  try {
    localStorage.setItem(KEYS.CONFIRMED_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Error saving plans to storage', e);
  }
}

export function loadSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SCHOOL_SETTINGS);
      return DEFAULT_SCHOOL_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export function saveSettings(settings: SchoolSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function resetToDefaults(): {
  teachers: Teacher[];
  schedules: Record<string, TeacherSchedule>;
} {
  saveTeachers(INITIAL_TEACHERS);
  saveSchedules(INITIAL_SCHEDULES);
  return { teachers: INITIAL_TEACHERS, schedules: INITIAL_SCHEDULES };
}
