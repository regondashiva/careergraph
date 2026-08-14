// Node Entities

export interface Candidate {
  id: string;
  name: string;
  email: string;
  location: string;
  experienceYears: number;
  headline: string;
  bio: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Programming' | 'AI/ML' | 'Cloud' | 'DevOps' | 'Data' | 'Tools';
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract';
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  salaryMin: number;
  salaryMax: number;
  remote: boolean;
  postedAt: string;
  companyName?: string;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  companySize: string;
  website: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  githubUrl: string;
}

export interface Course {
  id: string;
  title: string;
  platform: string;
  url: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationHours: number;
  description: string;
}

export interface Technology {
  id: string;
  name: string;
  category: string;
}

// Relationship Property Interfaces

export interface CandidateSkillRel {
  level: string; // e.g. "Advanced", "Intermediate"
  years: number;
  lastUsed?: string;
}

export interface CandidateProjectRel {
  role: string;
  contribution?: string;
  startDate?: string;
  endDate?: string;
}

export interface JobSkillRel {
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  requiredLevel: string;
}

// Domain & API Payloads

export interface CandidateSkillItem {
  skill: Skill;
  relationship: CandidateSkillRel;
}

export interface JobMatchResult {
  job: Job;
  company: Company | null;
  matchedSkills: string[];
  missingSkills: string[];
  totalRequiredCount: number;
  matchedCount: number;
  matchPercentage: number;
  matchingSkillsDetail?: Skill[];
  missingSkillsDetail?: Skill[];
}

export interface SkillGapItem {
  skill: Skill;
  importance: string;
  requiredLevel: string;
  teachingCourses: Course[];
}

export interface SkillGapAnalysis {
  candidateId: string;
  jobId: string;
  jobTitle: string;
  companyName?: string;
  matchPercentage: number;
  matchedSkills: Skill[];
  missingSkills: SkillGapItem[];
}

export interface ProjectEvidence {
  project: Project;
  demonstratedSkills: Skill[];
  matchingJobSkillsCount: number;
}

export interface LearningPathStep {
  stepIndex: number;
  skill: Skill;
  status: 'possessed' | 'missing' | 'target';
  prerequisiteFor?: string[];
  recommendedCourses: Course[];
}

export interface LearningPathAnalysis {
  candidateId: string;
  targetJob: Job;
  pathSteps: LearningPathStep[];
}

// Visual Graph Explorer Data Model

export interface GraphNode {
  id: string;
  label: string;
  type: 'Candidate' | 'Skill' | 'Job' | 'Company' | 'Project' | 'Course' | 'Technology';
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string; // e.g. HAS_SKILL, BUILT, REQUIRES, USES_SKILL, OFFERED_BY, TEACHES, PREREQUISITE_OF
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  queryMetadata?: {
    cypherQuery: string;
    hopCount: number;
    description: string;
  };
}

// Standard API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
