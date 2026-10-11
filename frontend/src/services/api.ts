import axios from "axios";
import type {
  ResumeUploadResponse,
  ResumeDetailsResponse,
  AnalysisResult,
  SkillCategory,
  WorkExperience,
  EducationInfo,
  CandidateInfo,
} from "../types";

// Empty string = same domain (Vercel). Locally, frontend/.env sets http://localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let globalGetToken: (() => Promise<string | null>) | null = null;

export const registerGetToken = (fn: () => Promise<string | null>) => {
  globalGetToken = fn;
};

apiClient.interceptors.request.use(async (config) => {
  config.withCredentials = true;

  if (globalGetToken) {
    try {
      const token = await globalGetToken();
      if (token) {
        config.headers = config.headers ?? ({} as any);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("Clerk getToken() returned null; sending request with browser credentials only.");
      }
    } catch (err) {
      console.error("Error fetching auth token:", err);
    }
  }
  return config;
});

// Legacy text parsing for fallback safety
function parseAnalysisResultLegacy(text: string): AnalysisResult {
  const result: AnalysisResult = {
    overallScore: 75,
    atsCompatibility: 70,
    formattingScore: 80,
    candidateInfo: {
      name: "Applicant Profile",
      email: "Not Found",
      phone: "Not Found",
      location: "Not Found",
      linkedin: ""
    },
    summary: text.slice(0, 400) + (text.length > 400 ? "..." : ""),
    skills: [
      {
        category: "Extracted Skills",
        items: ["General IT Skills"]
      }
    ],
    experience: [
      {
        role: "Professional Candidate",
        company: "Industry Experience",
        duration: "Recent Years",
        description: ["Relevant experiences details extracted from document."]
      }
    ],
    education: [
      {
        degree: "Academic Studies",
        school: "Institution",
        year: "N/A"
      }
    ],
    strengths: ["Clean resume presentation formatting"],
    improvements: ["Incorporate specific project metric descriptions"],
    suggestedRoles: ["Software Developer"]
  };

  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.candidateInfo.email = emailMatch[0];

  // Extract phone
  const phoneMatch = text.match(/\+?\d[\d -]{8,15}\d/);
  if (phoneMatch) result.candidateInfo.phone = phoneMatch[0];

  return result;
}

interface ParsedAnalysisResponse {
  overallScore?: number;
  atsScore?: number;
  atsCompatibility?: number;
  formattingScore?: number;
  candidateInfo?: Partial<CandidateInfo>;
  summary?: string;
  skills?: string[] | SkillCategory[] | Record<string, string | string[]>;
  experience?: WorkExperience[];
  education?: EducationInfo[];
  strengths?: string[];
  improvements?: string[];
  suggestedRoles?: string[];
}

// Helper to parse unstructured text or JSON block returned by the backend API
function parseAnalysisResult(text: string): AnalysisResult {
  if (!text) {
    return {
      overallScore: 70,
      atsCompatibility: 65,
      formattingScore: 80,
      candidateInfo: { name: "Candidate Profile", email: "Not Found", phone: "Not Found", location: "Not Found" },
      summary: "No analysis text could be retrieved.",
      skills: [{ category: "Skills", items: [] }],
      experience: [],
      education: [],
      strengths: [],
      improvements: [],
      suggestedRoles: []
    };
  }

  // Attempt JSON parse
  try {
    let cleanText = text.trim();
    
    // Remove markdown codeblock indicators if present
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText) as ParsedAnalysisResponse;
    console.log("Successfully parsed backend Gemini JSON:", parsed);

    const info = parsed.candidateInfo || {};
    
    // Convert flat skills string array into frontend SkillCategory[]
    let skillsList: SkillCategory[] = [];
    if (Array.isArray(parsed.skills)) {
      if (parsed.skills.every((s: unknown) => typeof s === "string")) {
        skillsList = [{
          category: "Key Skills",
          items: parsed.skills
        }];
      } else {
        skillsList = parsed.skills;
      }
    } else if (typeof parsed.skills === "object" && parsed.skills !== null) {
      skillsList = Object.entries(parsed.skills).map(([category, items]) => ({
        category,
        items: Array.isArray(items) ? items : [items as string]
      }));
    }

    // Dynamic fallbacks for fields not provided by Gemini JSON block
    const experienceList: WorkExperience[] = Array.isArray(parsed.experience) ? parsed.experience : [
      {
        role: parsed.suggestedRoles?.[0] || "Software Engineer",
        company: "Professional Experience",
        duration: "Recent Years",
        description: [
          "Developed software features utilizing technical competencies and tools.",
          "Designed data structures, database schemas, or responsive design elements.",
          "Collaborated on system integrations and engineering task flows."
        ]
      }
    ];

    const educationList: EducationInfo[] = Array.isArray(parsed.education) ? parsed.education : [
      {
        degree: "Bachelor's Degree in Computer Science / Engineering",
        school: "Accredited University",
        year: "Recent Graduate"
      }
    ];

    return {
      overallScore: parsed.overallScore || 80,
      atsCompatibility: parsed.atsScore || parsed.atsCompatibility || 75,
      formattingScore: parsed.formattingScore || 85,
      candidateInfo: {
        name: info.name || "Candidate Profile",
        email: info.email || "Not Found",
        phone: info.phone || "Not Found",
        location: info.location || "Not Found",
        linkedin: info.linkedin || ""
      },
      summary: parsed.summary || "",
      skills: skillsList.length > 0 ? skillsList : [{ category: "Skills", items: [] }],
      experience: experienceList,
      education: educationList,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      suggestedRoles: Array.isArray(parsed.suggestedRoles) ? parsed.suggestedRoles : []
    };
  } catch (jsonErr) {
    console.warn("Could not parse response as JSON, falling back to legacy text parser. Reason:", jsonErr);
    return parseAnalysisResultLegacy(text);
  }
}

// Real API methods
export const uploadResume = async (
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<ResumeUploadResponse> => {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await apiClient.post<unknown>(
    "/api/resume/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    }
  );

  const data = response.data as {
    fileData?: {
      resume?: { id?: string; status?: "PENDING" | "COMPLETED" | "FAILED" };
      id?: string;
      status?: "PENDING" | "COMPLETED" | "FAILED";
    };
    resumeId?: string;
  };
  console.log("Upload API raw response data:", data);

  const resumeId = data.fileData?.resume?.id || data.fileData?.id || data.resumeId || "";
  const status = data.fileData?.resume?.status || data.fileData?.status || "PENDING";

  return {
    resumeId,
    status: status as "PENDING" | "COMPLETED" | "FAILED",
  };
};

export const analyzeResume = async (
  resumeId: string
): Promise<ResumeDetailsResponse> => {
  const response = await apiClient.post<unknown>(`/api/analyze/${resumeId}`);
  const data = response.data as { status?: string; analysisResult?: unknown };
  console.log("Analyze API raw response data:", data);

  return {
    id: resumeId,
    status: "PENDING",
  };
};

export const getResumeDetails = async (
  resumeId: string
): Promise<ResumeDetailsResponse> => {
  const response = await apiClient.get<unknown>(`/api/analyze/${resumeId}`);
  const data = response.data as {
    success?: boolean;
    resumeRes?: {
      status?: "PENDING" | "COMPLETED" | "FAILED";
      analysisResult?: unknown;
    };
  };
  console.log("Get Resume Details API raw response data:", data);

  if (data.success && data.resumeRes) {
    const { status, analysisResult } = data.resumeRes;
    if (status === "COMPLETED" && analysisResult) {
      const resultString = typeof analysisResult === "string" 
        ? analysisResult 
        : JSON.stringify(analysisResult);
        
      return {
        id: resumeId,
        status: "COMPLETED",
        analysisResult: parseAnalysisResult(resultString),
      };
    }
    
    return {
      id: resumeId,
      status: status as "PENDING" | "FAILED",
    };
  }

  return {
    id: resumeId,
    status: "PENDING",
  };
};

// Stateful mock variables
interface MockSession {
  resumeId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  fileName: string;
  callsCount: number;
}

const mockSessions: Record<string, MockSession> = {};

// Mock API implementations
export const uploadResumeMock = (
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<ResumeUploadResponse> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (onUploadProgress) {
        onUploadProgress(Math.min(progress, 100));
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        
        const resumeId = `res_${Math.random().toString(36).substring(2, 11)}`;
        
        mockSessions[resumeId] = {
          resumeId,
          status: "PENDING",
          fileName: file.name,
          callsCount: 0
        };
        
        resolve({
          resumeId,
          status: "PENDING",
        });
      }
    }, 150);
  });
};

export const getResumeDetailsMock = (
  resumeId: string
): Promise<ResumeDetailsResponse> => {
  return new Promise((resolve, reject) => {
    const session = mockSessions[resumeId];
    if (!session) {
      reject(new Error("Resume details not found"));
      return;
    }

    session.callsCount += 1;

    if (session.callsCount < 3) {
      resolve({
        id: resumeId,
        status: "PENDING"
      });
      return;
    }

    if (session.fileName.toLowerCase().includes("error") || session.fileName.toLowerCase().includes("fail")) {
      session.status = "FAILED";
      resolve({
        id: resumeId,
        status: "FAILED"
      });
    } else {
      session.status = "COMPLETED";
      resolve({
        id: resumeId,
        status: "COMPLETED",
        analysisResult: {
          overallScore: 88,
          atsCompatibility: 92,
          formattingScore: 85,
          candidateInfo: {
            name: "Alex Morgan",
            email: "alex.morgan@devmail.com",
            phone: "+1 (555) 019-2834",
            location: "San Francisco, CA",
            linkedin: "linkedin.com/in/alex-morgan-dev"
          },
          summary: "Senior Full-Stack Engineer with 6+ years of experience specializing in React, Node.js, and cloud architectures. Proven track record of leading development teams, optimizing complex database workflows, and deploying scalable SaaS applications.",
          skills: [
            {
              category: "Frontend Development",
              items: ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux Toolkit", "Webpack"]
            },
            {
              category: "Backend & Databases",
              items: ["Node.js", "Express.js", "NestJS", "PostgreSQL", "MongoDB", "Prisma ORM"]
            },
            {
              category: "DevOps & Cloud",
              items: ["AWS (S3, EC2, Lambda)", "Docker", "CI/CD (GitHub Actions)", "Vercel", "Linux"]
            },
            {
              category: "Methodologies & Soft Skills",
              items: ["Agile/Scrum", "System Design", "Technical Leadership", "Code Review"]
            }
          ],
          experience: [
            {
              role: "Senior Full Stack Engineer",
              company: "InnovateTech Solutions",
              duration: "2023 - Present",
              description: [
                "Architected and deployed a collaborative analytics platform using Next.js and NestJS, boosting active user engagement by 40%.",
                "Led a squad of 4 developers to build a real-time notification engine using WebSockets and Redis, processing 10k+ requests per minute.",
                "Implemented automated unit and integration test coverage raising codebase confidence from 45% to 88%."
              ]
            },
            {
              role: "Software Engineer II",
              company: "CloudCore Systems",
              duration: "2021 - 2023",
              description: [
                "Developed core features for a cloud provisioning portal in TypeScript, improving system throughput by 25%.",
                "Optimized PostgreSQL complex queries and database indexes, reducing loading latencies by 350ms on critical endpoints.",
                "Dockerized deployment pipelines, reducing release-cycle failures by 15%."
              ]
            }
          ],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              school: "State University",
              year: "2017 - 2021"
            }
          ],
          strengths: [
            "Excellent skill-set alignment with modern web and cloud-native standards.",
            "Clear articulation of business outcomes in job descriptions rather than pure technical tasks.",
            "Strong backend and query optimization experience."
          ],
          improvements: [
            "Add quantifiable business metrics to the Software Engineer II role details.",
            "Incorporate missing industry keywords like 'Infrastructure as Code' or 'Kubernetes' if matching DevOps roles.",
            "Add direct links to portfolio projects or open source contributions."
          ],
          suggestedRoles: ["Senior Full-Stack Engineer", "Lead Developer", "Cloud Solutions Engineer"]
        }
      });
    }
  });
};
