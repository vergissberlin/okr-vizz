import type { KeyResult } from "../types/okr";
import { fetchIssueStatus as mockFetchIssueStatus, fetchIssueComments as mockFetchIssueComments } from "./githubMock";

const GITHUB_API_BASE = "https://api.github.com";
const isDevelopment = import.meta.env.DEV;

export interface GitHubIssue {
  state: string;
  labels: Array<{ name: string }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  comments: number;
  milestone?: {
    title: string;
    due_on: string;
  };
  reactions: {
    total_count: number;
    "+1": number;
    "-1": number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubComment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
  reactions: {
    total_count: number;
    "+1": number;
    "-1": number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

async function fetchFromGitHubAPI(endpoint: string): Promise<any> {
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from GitHub API: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchIssueStatus(issueUrl: string): Promise<GitHubIssue> {
  if (isDevelopment) {
    return mockFetchIssueStatus(issueUrl);
  }

  const match = issueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
  if (!match) {
    throw new Error("Invalid GitHub issue URL");
  }

  const [, owner, repo, issueNumber] = match;
  return fetchFromGitHubAPI(`/repos/${owner}/${repo}/issues/${issueNumber}`);
}

export async function fetchIssueComments(issueUrl: string): Promise<GitHubComment[]> {
  if (isDevelopment) {
    return mockFetchIssueComments(issueUrl);
  }

  const match = issueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
  if (!match) {
    throw new Error("Invalid GitHub issue URL");
  }

  const [, owner, repo, issueNumber] = match;
  return fetchFromGitHubAPI(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`);
}

export function determineStatusFromIssue(issue: GitHubIssue): string {
  if (issue.state === "closed") {
    return "done";
  }

  const labels = issue.labels.map(label => label.name);
  if (labels.includes("in-progress")) {
    return "in-progress";
  }
  if (labels.includes("blocked")) {
    return "blocked";
  }
  if (labels.includes("todo")) {
    return "todo";
  }

  return "todo";
}

export function getIssueProgress(issue: GitHubIssue): number {
  if (issue.state === "closed") {
    return 100;
  }

  const reactions = issue.reactions;
  const positiveReactions = reactions["+1"] + reactions.hooray + reactions.heart + reactions.rocket;
  const negativeReactions = reactions["-1"] + reactions.confused;
  const totalReactions = positiveReactions + negativeReactions;

  if (totalReactions === 0) {
    return 0;
  }

  return Math.round((positiveReactions / totalReactions) * 100);
} 