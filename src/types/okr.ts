export type OKRLevel = 'company' | 'circle' | 'personal';
export type OKRStatus = "done" | "in-progress" | "blocked" | "todo";

export interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  dueDate: string;
  status: OKRStatus;
  assignees: Array<{
    name: string;
    email: string;
    avatarUrl: string;
  }>;
  githubIssueUrl?: string;
}

export interface Objective {
  id: string;
  title: string;
  level: "company" | "division" | "team";
  progress: number;
  keyResults: KeyResult[];
  children?: Objective[];
}

export interface OKRData {
  objectives: Objective[];
} 