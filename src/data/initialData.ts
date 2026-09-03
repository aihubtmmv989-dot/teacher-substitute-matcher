import { Teacher, TeacherSchedule, PeriodId } from '../types';

export const PERIOD_IDS: PeriodId[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];

export const PERIOD_TIMES: Record<PeriodId, string> = {
  P1: '07:50 - 08:30',
  P2: '08:30 - 09:10',
  P3: '09:10 - 09:50',
  P4: '09:50 - 10:30',
  P5: '10:50 - 11:30',
  P6: '11:30 - 12:10',
  P7: '12:10 - 12:50',
  P8: '12:50 - 01:30',
};

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-bandara',
    name: 'Ms. Bandara AMAI',
    primarySubjects: ['English'],
    gradesTaught: ['6', '7', '9', '10', '13'],
    isAvailable: true,
    totalCumulativeRelief: 2,
  },
  {
    id: 't-shifaan',
    name: 'Mr. Shifaan AH',
    primarySubjects: ['ICT'],
    gradesTaught: ['7', '8', '10', '11', '12', '13'],
    isAvailable: true,
    totalCumulativeRelief: 1,
  },
  {
    id: 't-ahfara',
    name: 'Ms. Ahfara MA',
    primarySubjects: ['History', 'Geography'],
    gradesTaught: ['6', '7', '9', '10'],
    isAvailable: true,
    totalCumulativeRelief: 3,
  },
  {
    id: 't-kijanuja',
    name: 'Ms. Kijanuja Y',
    primarySubjects: ['Science', 'Agriculture'],
    gradesTaught: ['7', '9', '10', '11'],
    isAvailable: true,
    totalCumulativeRelief: 2,
  },
  {
    id: 't-kirustika',
    name: 'Ms. Kirustika N',
    primarySubjects: ['Maths'],
    gradesTaught: ['6', '7', '8', '9', '10'],
    isAvailable: true,
    totalCumulativeRelief: 1,
  },
];

export const INITIAL_SCHEDULES: Record<string, TeacherSchedule> = {
  't-bandara': {
    teacherId: 't-bandara',
    periods: {
      P1: { isFree: false, class: '9A', subject: 'English' },
      P2: { isFree: false, class: '6C', subject: 'English' },
      P3: { isFree: true, class: 'FREE', subject: 'FREE' },
      P4: { isFree: false, class: '7B', subject: 'English' },
      P5: { isFree: false, class: '10D', subject: 'English' },
      P6: { isFree: false, class: '7C', subject: 'English' },
      P7: { isFree: false, class: '13', subject: 'English' },
      P8: { isFree: true, class: 'FREE', subject: 'FREE' },
    },
  },
  't-shifaan': {
    teacherId: 't-shifaan',
    periods: {
      P1: { isFree: false, class: '13', subject: 'ICT' },
      P2: { isFree: false, class: '13', subject: 'ICT' },
      P3: { isFree: false, class: '7A', subject: 'ICT' },
      P4: { isFree: false, class: '8A', subject: 'ICT' },
      P5: { isFree: false, class: '11C/D', subject: 'ICT' },
      P6: { isFree: false, class: '10D', subject: 'ICT' },
      P7: { isFree: false, class: '12', subject: 'ICT' },
      P8: { isFree: false, class: '12', subject: 'ICT' },
    },
  },
  't-ahfara': {
    teacherId: 't-ahfara',
    periods: {
      P1: { isFree: true, class: 'FREE', subject: 'FREE' },
      P2: { isFree: false, class: '10C', subject: 'History' },
      P3: { isFree: false, class: '9A', subject: 'Geography' },
      P4: { isFree: false, class: '7D', subject: 'History' },
      P5: { isFree: false, class: '7B', subject: 'History' },
      P6: { isFree: true, class: 'FREE', subject: 'FREE' },
      P7: { isFree: false, class: '10E', subject: 'History' },
      P8: { isFree: false, class: '6C', subject: 'History' },
    },
  },
  't-kijanuja': {
    teacherId: 't-kijanuja',
    periods: {
      P1: { isFree: false, class: '9C', subject: 'Science' },
      P2: { isFree: false, class: '11E', subject: 'Agriculture' },
      P3: { isFree: true, class: 'FREE', subject: 'FREE' },
      P4: { isFree: false, class: '10C', subject: 'Agriculture' },
      P5: { isFree: false, class: '7C', subject: 'Science' },
      P6: { isFree: true, class: 'FREE', subject: 'FREE' },
      P7: { isFree: false, class: '10D', subject: 'Science' },
      P8: { isFree: false, class: '10D', subject: 'Science' },
    },
  },
  't-kirustika': {
    teacherId: 't-kirustika',
    periods: {
      P1: { isFree: false, class: '6D', subject: 'Maths' },
      P2: { isFree: true, class: 'FREE', subject: 'FREE' },
      P3: { isFree: false, class: '8C', subject: 'Maths' },
      P4: { isFree: false, class: '10D', subject: 'Maths' },
      P5: { isFree: true, class: 'FREE', subject: 'FREE' },
      P6: { isFree: true, class: 'FREE', subject: 'FREE' },
      P7: { isFree: false, class: '7D', subject: 'Maths' },
      P8: { isFree: false, class: '9C', subject: 'Maths' },
    },
  },
};

export const DEFAULT_SCHOOL_SETTINGS = {
  schoolName: 'Central College Colombo',
  principalName: 'W. M. Jayasinghe (Principal)',
  academicTerm: 'Term 1',
  academicYear: '2026',
};
