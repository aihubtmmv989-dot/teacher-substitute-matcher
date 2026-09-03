import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// AI Substitute Reasoning & Ranking Endpoint
app.post('/api/substitute-ai', async (req, res) => {
  try {
    const { assignments, teachers } = req.body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'Gemini API key not configured. Using deterministic matching.',
        assignments, // Return unchanged assignments
      });
    }

    // Filter only matched assignments that have multiple eligible candidates to rank
    const periodsToEvaluate = assignments.filter(
      (a: any) => a.status === 'matched' && a.alternativeCandidates && a.alternativeCandidates.length > 0
    );

    if (periodsToEvaluate.length === 0) {
      return res.status(200).json({ success: true, assignments });
    }

    const promptData = periodsToEvaluate.map((a: any) => ({
      period: a.period,
      class: a.class,
      subject: a.subject,
      absentTeacher: a.absentTeacherName,
      currentlyChosenSubstitute: a.assignedTeacherName,
      // ONLY free candidates are passed. No busy teachers!
      availableFreeCandidates: a.alternativeCandidates.map((c: any) => ({
        teacherId: c.teacherId,
        teacherName: c.teacherName,
        subjectsTaught: c.subjects,
        reliefPeriodsTodayAlready: c.assignedCountToday,
        heuristicScore: c.score,
      })),
    }));

    const systemInstruction = `You are an expert school administrative assistant assisting with teacher relief scheduling.
You are given a list of relief periods for absent teachers, and for each period, a pre-verified list of teachers who are 100% FREE.
CRITICAL CONSTRAINT: You must ONLY select a substitute from the 'availableFreeCandidates' list for that period. Never invent or choose anyone not listed.
CRITICAL CRITERIA:
1. Balance workload: avoid giving many relief periods to the same teacher.
2. Subject affinity: Prefer teachers with related subject expertise (e.g. Science/Agri, Maths/ICT, English/Humanities).
3. Provide a concise, professional 1-sentence administrative explanation starting with an affirmative justification (e.g. "Specialist in English; balanced workload with 0 prior relief duties").`;

    const promptText = `Evaluate these relief periods and rank/confirm the optimal substitute among the free candidates:
${JSON.stringify(promptData, null, 2)}

Return a JSON array where each object has:
- period: string
- selectedTeacherId: string (MUST be one of the candidate IDs)
- selectedTeacherName: string
- professionalReason: string (concise explanation for the school record)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              period: { type: Type.STRING },
              selectedTeacherId: { type: Type.STRING },
              selectedTeacherName: { type: Type.STRING },
              professionalReason: { type: Type.STRING },
            },
            required: ['period', 'selectedTeacherId', 'selectedTeacherName', 'professionalReason'],
          },
        },
      },
    });

    const parsedResults = JSON.parse(response.text || '[]');
    const resultsMap = new Map<string, any>();
    for (const r of parsedResults) {
      resultsMap.set(r.period, r);
    }

    // Merge AI justifications into assignments safely
    const enhancedAssignments = assignments.map((assignment: any) => {
      const aiChoice = resultsMap.get(assignment.period);
      if (!aiChoice) return assignment;

      // Verify the AI-selected teacher was actually in the free candidate list
      const isValidCandidate = assignment.alternativeCandidates.some(
        (c: any) => c.teacherId === aiChoice.selectedTeacherId
      );

      if (isValidCandidate) {
        return {
          ...assignment,
          assignedTeacherId: aiChoice.selectedTeacherId,
          assignedTeacherName: aiChoice.selectedTeacherName,
          reason: `[AI Verified] ${aiChoice.professionalReason}`,
          aiAssisted: true,
        };
      }
      return assignment;
    });

    return res.status(200).json({
      success: true,
      assignments: enhancedAssignments,
    });
  } catch (error: any) {
    console.error('Gemini AI relief error:', error);
    // Graceful fallback to deterministic assignments
    return res.status(200).json({
      success: false,
      message: error?.message || 'AI processing encountered an issue, used deterministic matching.',
      assignments: req.body.assignments,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teacher Substitute Matcher server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
