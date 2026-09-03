import { Teacher, TeacherSchedule, PeriodId, AbsenceRecord, ReliefAssignment, CandidateCandidate } from '../types';
import { PERIOD_IDS } from '../data/initialData';

// Domain affinities for subject matching
const SUBJECT_AFFINITIES: Record<string, string[]> = {
  English: ['Literature', 'History', 'Geography', 'Social Studies'],
  History: ['Geography', 'English', 'Social Studies', 'Civics'],
  Geography: ['History', 'Science', 'Agriculture', 'Social Studies'],
  Science: ['Agriculture', 'Maths', 'ICT', 'Health Science'],
  Agriculture: ['Science', 'Geography', 'Maths'],
  ICT: ['Maths', 'Science', 'Technology'],
  Maths: ['ICT', 'Science', 'Statistics'],
};

// Helper to extract grade number from class string, e.g. "9A" -> 9, "11C/D" -> 11, "13" -> 13
function extractGrade(className: string): string {
  const match = className.match(/\d+/);
  return match ? match[0] : '';
}

export function evaluateCandidateScore(
  candidate: Teacher,
  absentTeacher: Teacher,
  classString: string,
  subjectString: string,
  assignedTodayCount: number
): { score: number; reasonParts: string[] } {
  let score = 50; // baseline free score
  const reasonParts: string[] = ['Available in timetable'];

  // 1. Workload fairness penalty (highest priority to balance load)
  if (assignedTodayCount > 0) {
    score -= assignedTodayCount * 35;
    reasonParts.push(`Already has ${assignedTodayCount} relief duty today`);
  } else {
    score += 15;
    reasonParts.push('No relief duties assigned today yet');
  }

  // Cumulative relief workload tie-breaker
  score -= Math.min(candidate.totalCumulativeRelief * 2, 20);

  // 2. Subject Knowledge affinity
  const targetSubjClean = subjectString.trim();
  const hasExactSubject = candidate.primarySubjects.some(
    (s) => s.toLowerCase() === targetSubjClean.toLowerCase()
  );

  if (hasExactSubject) {
    score += 40;
    reasonParts.push(`Primary subject specialist in ${targetSubjClean}`);
  } else {
    const relatedList = SUBJECT_AFFINITIES[targetSubjClean] || [];
    const hasRelatedSubject = candidate.primarySubjects.some((s) =>
      relatedList.some((rel) => rel.toLowerCase() === s.toLowerCase())
    );
    if (hasRelatedSubject) {
      score += 20;
      reasonParts.push(`Subject domain background (${candidate.primarySubjects.join(', ')})`);
    }
  }

  // 3. Grade-level experience match
  const targetGrade = extractGrade(classString);
  if (targetGrade && candidate.gradesTaught.includes(targetGrade)) {
    score += 15;
    reasonParts.push(`Teaches Grade ${targetGrade}`);
  }

  return { score, reasonParts };
}

export function matchSubstitutesDeterministic(
  absences: AbsenceRecord[],
  teachers: Teacher[],
  schedules: Record<string, TeacherSchedule>,
  initialWorkload: Record<string, number> = {}
): ReliefAssignment[] {
  const assignments: ReliefAssignment[] = [];
  const assignedCountsToday: Record<string, number> = { ...initialWorkload };
  teachers.forEach((t) => {
    if (assignedCountsToday[t.id] === undefined) {
      assignedCountsToday[t.id] = 0;
    }
  });

  // Track who is assigned in which period during this day to avoid double-booking relief
  const periodBookings: Record<PeriodId, Set<string>> = {
    P1: new Set(),
    P2: new Set(),
    P3: new Set(),
    P4: new Set(),
    P5: new Set(),
    P6: new Set(),
    P7: new Set(),
    P8: new Set(),
  };

  // Determine which teachers are absent for which periods
  const absentInPeriod: Record<PeriodId, Set<string>> = {
    P1: new Set(),
    P2: new Set(),
    P3: new Set(),
    P4: new Set(),
    P5: new Set(),
    P6: new Set(),
    P7: new Set(),
    P8: new Set(),
  };

  absences.forEach((absence) => {
    absence.periods.forEach((p) => {
      absentInPeriod[p].add(absence.teacherId);
    });
  });

  // For each absence, look at each period they need relief for
  for (const absence of absences) {
    const absentTeacher = teachers.find((t) => t.id === absence.teacherId);
    if (!absentTeacher) continue;
    const schedule = schedules[absentTeacher.id];
    if (!schedule) continue;

    // Process periods in chronological order P1..P8
    for (const period of PERIOD_IDS) {
      if (!absence.periods.includes(period)) continue;

      const slot = schedule.periods[period];
      // If the absent teacher was FREE anyway in that period, no relief required!
      if (!slot || slot.isFree || slot.class === 'FREE') continue;

      // Find all candidate teachers who are genuinely FREE:
      // - Must NOT be the absent teacher
      // - Must NOT be absent during this period
      // - Must be marked available in system (isAvailable: true)
      // - Timetable slot for this period must be FREE
      // - Must NOT have already been assigned relief in this period for another absent teacher
      const eligibleCandidates: CandidateCandidate[] = [];

      for (const candidate of teachers) {
        if (candidate.id === absentTeacher.id) continue;
        if (!candidate.isAvailable) continue;
        if (absentInPeriod[period].has(candidate.id)) continue;
        if (periodBookings[period].has(candidate.id)) continue;

        const candSchedule = schedules[candidate.id];
        if (!candSchedule) continue;
        const candSlot = candSchedule.periods[period];

        // STRICT RULE: Do not assign a teacher who is teaching another class
        if (!candSlot || !candSlot.isFree || candSlot.class !== 'FREE') {
          continue;
        }

        const evaluation = evaluateCandidateScore(
          candidate,
          absentTeacher,
          slot.class,
          slot.subject,
          assignedCountsToday[candidate.id] || 0
        );

        eligibleCandidates.push({
          teacherId: candidate.id,
          teacherName: candidate.name,
          score: evaluation.score,
          reason: evaluation.reasonParts.join('; '),
          subjects: candidate.primarySubjects,
          assignedCountToday: assignedCountsToday[candidate.id] || 0,
        });
      }

      // Sort candidate teachers by score descending
      eligibleCandidates.sort((a, b) => b.score - a.score);

      const assignmentId = `${absence.id}-${period}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      if (eligibleCandidates.length === 0) {
        // Requirement 6: NO AVAILABLE TEACHER
        assignments.push({
          id: assignmentId,
          period,
          class: slot.class,
          subject: slot.subject,
          absentTeacherId: absentTeacher.id,
          absentTeacherName: absentTeacher.name,
          assignedTeacherId: null,
          assignedTeacherName: null,
          status: 'no_relief',
          reason: '⚠ NO AVAILABLE RELIEF TEACHER — INFORM PRINCIPAL',
          alternativeCandidates: [],
        });
      } else {
        const bestCandidate = eligibleCandidates[0];
        // Record assignment
        periodBookings[period].add(bestCandidate.teacherId);
        assignedCountsToday[bestCandidate.teacherId] = (assignedCountsToday[bestCandidate.teacherId] || 0) + 1;

        // Build human-friendly administrative reason
        const reasonText = `${bestCandidate.reason}`;

        assignments.push({
          id: assignmentId,
          period,
          class: slot.class,
          subject: slot.subject,
          absentTeacherId: absentTeacher.id,
          absentTeacherName: absentTeacher.name,
          assignedTeacherId: bestCandidate.teacherId,
          assignedTeacherName: bestCandidate.teacherName,
          status: 'matched',
          reason: reasonText,
          alternativeCandidates: eligibleCandidates,
        });
      }
    }
  }

  // Sort assignments by period order P1..P8
  assignments.sort((a, b) => PERIOD_IDS.indexOf(a.period) - PERIOD_IDS.indexOf(b.period));

  return assignments;
}
