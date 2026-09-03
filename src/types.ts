export type PeriodId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8';

export interface PeriodSlot {
  isFree: boolean;
  class: string;      // e.g. "9A", "6C", "FREE"
  subject: string;    // e.g. "English", "ICT", "FREE"
  room?: string;
}

export interface Teacher {
  id: string;
  name: string;
  primarySubjects: string[];
  gradesTaught: string[];
  isAvailable: boolean;
  unavailableReason?: string;
  totalCumulativeRelief: number;
}

export interface TeacherSchedule {
  teacherId: string;
  periods: Record<PeriodId, PeriodSlot>;
}

export interface AbsenceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  type: 'whole_day' | 'specific_periods';
  periods: PeriodId[];
  reason?: string;
  createdAt: string;
}

export interface CandidateCandidate {
  teacherId: string;
  teacherName: string;
  score: number;
  reason: string;
  subjects: string[];
  assignedCountToday: number;
}

export interface ReliefAssignment {
  id: string;
  period: PeriodId;
  class: string;
  subject: string;
  absentTeacherId: string;
  absentTeacherName: string;
  assignedTeacherId: string | null;
  assignedTeacherName: string | null;
  status: 'matched' | 'no_relief';
  reason: string;
  aiAssisted?: boolean;
  alternativeCandidates: CandidateCandidate[];
  isManualOverride?: boolean;
}

export interface DailyReliefPlan {
  id: string;
  date: string;
  absentTeacherIds: string[];
  assignments: ReliefAssignment[];
  confirmed: boolean;
  confirmedAt?: string;
  adminNotes?: string;
  principalNotes?: string;
  schoolName: string;
}

export interface WorkloadSummary {
  teacherId: string;
  teacherName: string;
  todayReliefCount: number;
  cumulativeReliefCount: number;
  isAvailable: boolean;
}

export interface SchoolSettings {
  schoolName: string;
  principalName: string;
  academicTerm: string;
  academicYear: string;
}
