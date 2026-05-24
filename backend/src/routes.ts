import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { createRecord } from './services';

const router = Router();

type RouteDefinition = {
  method: string;
  path: string;
  purpose: string;
  response_shape: any;
};

const routeDefinitions: RouteDefinition[] = [
  {
    "method": "get",
    "path": "/health",
    "purpose": "Returns API status for local development and readiness checks.",
    "response_shape": {
      "status": "string",
      "service": "string",
      "timestamp": "ISO datetime string"
    }
  },
  {
    "method": "post",
    "path": "/learners",
    "purpose": "Creates an anonymous learner profile for progress tracking without collecting sensitive personal data.",
    "response_shape": {
      "learner": {
        "id": "string",
        "displayName": "optional string",
        "createdAt": "ISO datetime string"
      }
    }
  },
  {
    "method": "get",
    "path": "/scenarios",
    "purpose": "Returns a list of safe educational phishing awareness scenario summaries.",
    "response_shape": {
      "scenarios": [
        {
          "id": "string",
          "title": "string",
          "summary": "string",
          "difficulty": "beginner | intermediate | advanced",
          "topics": [
            "string"
          ],
          "estimatedMinutes": "number",
          "completed": "boolean"
        }
      ]
    }
  },
  {
    "method": "get",
    "path": "/scenarios/:scenarioId",
    "purpose": "Returns one scenario with simulated message content, educational indicators, and quiz metadata.",
    "response_shape": {
      "scenario": {
        "id": "string",
        "title": "string",
        "summary": "string",
        "difficulty": "beginner | intermediate | advanced",
        "topics": [
          "string"
        ],
        "estimatedMinutes": "number",
        "simulatedMessage": {
          "channel": "email | sms | collaboration_message",
          "fromLabel": "string",
          "subject": "string",
          "body": "string",
          "displayedLinks": [
            {
              "label": "string",
              "safeDisplayUrl": "string",
              "isClickable": "boolean always false"
            }
          ],
          "attachments": [
            {
              "fileName": "string",
              "description": "string"
            }
          ]
        },
        "indicators": [
          {
            "id": "string",
            "label": "string",
            "description": "string",
            "severity": "low | medium | high",
            "topic": "string"
          }
        ],
        "quiz": {
          "scenarioId": "string",
          "questions": [
            {
              "id": "string",
              "prompt": "string",
              "options": [
                {
                  "id": "string",
                  "label": "string"
                }
              ],
              "topic": "string"
            }
          ]
        }
      }
    }
  },
  {
    "method": "post",
    "path": "/scenarios/:scenarioId/quiz-submissions",
    "purpose": "Evaluates a learner quiz submission, persists progress, and returns educational feedback and recommendations.",
    "response_shape": {
      "submission": {
        "id": "string",
        "learnerId": "string",
        "scenarioId": "string",
        "scorePercent": "number",
        "correctCount": "number",
        "totalQuestions": "number",
        "submittedAt": "ISO datetime string",
        "passed": "boolean"
      },
      "feedback": [
        {
          "questionId": "string",
          "selectedOptionId": "string",
          "correctOptionId": "string",
          "isCorrect": "boolean",
          "explanation": "string",
          "topic": "string"
        }
      ],
      "weakTopics": [
        "string"
      ],
      "recommendedScenarioIds": [
        "string"
      ]
    }
  },
  {
    "method": "get",
    "path": "/learners/:learnerId/progress",
    "purpose": "Returns dashboard-ready progress summary for an anonymous learner.",
    "response_shape": {
      "progress": {
        "learnerId": "string",
        "totalScenarios": "number",
        "completedScenarios": "number",
        "completionPercent": "number",
        "averageScorePercent": "number",
        "topicPerformance": [
          {
            "topic": "string",
            "correctCount": "number",
            "attemptCount": "number",
            "scorePercent": "number"
          }
        ],
        "recentActivity": [
          {
            "submissionId": "string",
            "scenarioId": "string",
            "scenarioTitle": "string",
            "scorePercent": "number",
            "submittedAt": "ISO datetime string"
          }
        ],
        "recommendedScenarioIds": [
          "string"
        ]
      }
    }
  },
  {
    "method": "delete",
    "path": "/learners/:learnerId/progress",
    "purpose": "Deletes progress and quiz submissions for a learnerId while retaining safe scenario content.",
    "response_shape": {
      "success": "boolean",
      "learnerId": "string",
      "deletedSubmissionCount": "number"
    }
  },
  {
    "method": "get",
    "path": "/resources",
    "purpose": "Returns curated defensive anti-phishing resources and guidelines.",
    "response_shape": {
      "resources": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "category": "reporting | prevention | training | tools | guidelines",
          "topics": [
            "string"
          ],
          "url": "string",
          "sourceName": "string"
        }
      ]
    }
  }
];

const users: Array<{ id: string; name: string; email: string; password?: string; createdAt: string }> = [];
const sessions = new Map<string, string>();
const attempts: any[] = [];

function success(res: Response, data: unknown) {
  return res.json({
    success: true,
    data,
    error: null
  });
}

function failure(res: Response, statusCode: number, code: string, message: string) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details: null
    }
  });
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function currentUser(req: Request) {
  const sessionId = readCookie(req, "damocles_session");
  if (!sessionId) return null;

  const userId = sessions.get(sessionId);
  if (!userId) return null;

  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function createSession(res: Response, userId: string) {
  const sessionId = randomUUID();
  sessions.set(sessionId, userId);

  res.setHeader(
    "Set-Cookie",
    `damocles_session=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; SameSite=Lax`
  );
}

function sampleScenarioSummary() {
  return {
    id: "starter",
    title: "Starter Record",
    difficulty: "beginner",
    category: "legitimate",
    completed: false,
    bestScore: null,
    maxScore: 100
  };
}

function sampleScenarioDetail(id: string) {
  return {
    id,
    title: "Starter Record",
    difficulty: "beginner",
    category: "legitimate",
    email: {
      fromName: "Training System",
      fromEmail: "training@example.com",
      replyToEmail: null,
      subject: "Starter training record",
      receivedAt: new Date().toISOString(),
      bodyText: "This is a safe generated starter record used to verify the app workflow.",
      displayLinks: [],
      attachments: [],
      metadataHints: []
    },
    availableRedFlags: [],
    maxScore: 100
  };
}

function sampleFeedback(id: string) {
  return {
    id,
    scenarioId: "starter",
    scenarioTitle: "Starter Record",
    classification: "legitimate",
    correctClassification: "legitimate",
    isClassificationCorrect: true,
    selectedRedFlags: [],
    correctSelectedRedFlags: [],
    incorrectSelectedRedFlags: [],
    missedRedFlags: [],
    scoreAwarded: 100,
    maxScore: 100,
    explanation: "The generated backend returned a valid starter feedback response.",
    preventionTips: ["Use the generated project workflow to replace starter records with domain-specific records."],
    submittedAt: new Date().toISOString()
  };
}

function valueFor(typeName: unknown, key: string, req: Request, res: Response): unknown {
  const type = String(typeName || "");

  if (key === "user") {
    return currentUser(req);
  }

  if (key === "loggedOut") {
    return true;
  }

  if (key === "status") {
    return "ok";
  }

  if (key === "service") {
    return "Generated Backend";
  }

  if (key === "version") {
    return "1.0.0";
  }

  if (key === "scenarios" || type.includes("ScenarioSummary[]")) {
    return [sampleScenarioSummary()];
  }

  if (key === "scenario" || type.includes("ScenarioDetail")) {
    return sampleScenarioDetail(req.params.scenarioId || "starter");
  }

  if (key === "attempts" || type.includes("AttemptSummary[]")) {
    return attempts.map((attempt) => ({
      id: attempt.id,
      scenarioId: attempt.scenarioId || "starter",
      scenarioTitle: "Starter Record",
      scoreAwarded: attempt.scoreAwarded || 100,
      maxScore: 100,
      isClassificationCorrect: true,
      submittedAt: attempt.submittedAt
    }));
  }

  if (key === "attempt" && type.includes("AttemptFeedback")) {
    return sampleFeedback(req.params.attemptId || "starter");
  }

  if (key === "attempt" || type.includes("AttemptResult")) {
    const attempt = createRecord({
      scenarioId: req.params.scenarioId || "starter",
      scoreAwarded: 100,
      maxScore: 100,
      submittedAt: new Date().toISOString(),
      feedbackPath: ""
    });
    attempts.push(attempt);

    return {
      id: attempt.id,
      scenarioId: attempt.scenarioId,
      isClassificationCorrect: true,
      scoreAwarded: 100,
      maxScore: 100,
      submittedAt: attempt.submittedAt,
      feedbackPath: `/attempts/${attempt.id}/feedback`
    };
  }

  if (key === "summary" || type.includes("ProgressSummary")) {
    return {
      userId: currentUser(req)?.id || "anonymous",
      completedScenarioCount: attempts.length,
      totalAttemptCount: attempts.length,
      averageScorePercent: attempts.length ? 100 : 0,
      classificationAccuracyPercent: attempts.length ? 100 : 0,
      bestScoreTotal: attempts.length * 100,
      maxPossibleScoreTotal: attempts.length * 100,
      recentStreak: attempts.length
    };
  }

  if (key === "resources" || type.includes("EducationalResource[]")) {
    return [
      {
        id: "resource-1",
        title: "Generated Project Guide",
        summary: "A starter guide served from the backend API.",
        content: "This generated backend is connected to the frontend through typed API calls.",
        category: "getting-started",
        estimatedReadMinutes: 3
      }
    ];
  }

  if (type.includes("[]")) {
    return [];
  }

  if (type.includes("boolean")) {
    return true;
  }

  if (type.includes("number")) {
    return 0;
  }

  if (type.includes("string")) {
    return "";
  }

  return null;
}

function buildData(shape: any, req: Request, res: Response): Record<string, unknown> {
  const dataShape = shape?.data;

  if (!dataShape || typeof dataShape !== "object") {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(dataShape)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = buildData({ data: value }, req, res);
    } else {
      result[key] = valueFor(value, key, req, res);
    }
  }

  return result;
}

router.post("/auth/register", (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!name || !email || password.length < 8) {
    return failure(res, 400, "VALIDATION_ERROR", "Name, valid email, and password with 8+ characters are required.");
  }

  const existing = users.find((user) => user.email === email);
  if (existing) {
    return failure(res, 409, "EMAIL_ALREADY_REGISTERED", "Email is already registered.");
  }

  const user = {
    id: randomUUID(),
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  createSession(res, user.id);

  return success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

router.post("/auth/login", (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  const user = users.find((candidate) => candidate.email === email && candidate.password === password);
  if (!user) {
    return failure(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  createSession(res, user.id);

  return success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

router.post("/auth/logout", (req, res) => {
  const sessionId = readCookie(req, "damocles_session");
  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.setHeader("Set-Cookie", "damocles_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
  return success(res, { loggedOut: true });
});

router.get("/auth/session", (req, res) => {
  return success(res, { user: currentUser(req) });
});

for (const route of routeDefinitions) {
  const method = route.method.toLowerCase();

  if (route.path.startsWith("/auth/")) {
    continue;
  }

  if (typeof (router as any)[method] === "function") {
    (router as any)[method](route.path, (req: Request, res: Response) => {
      return success(res, buildData(route.response_shape, req, res));
    });
  }
}

export default router;
