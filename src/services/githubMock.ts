import type { GitHubIssue, GitHubComment } from "./github";

// Mock-Daten für GitHub Issues
const mockIssues: Record<string, GitHubIssue> = {
  "1": {
    state: "open",
    labels: [
      { name: "in-progress" },
      { name: "priority-high" }
    ],
    assignees: [
      {
        login: "maxmustermann",
        avatar_url: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
      }
    ],
    title: "Umsatzsteigerung Q1 2024",
    body: "Implementierung der neuen Marketing-Strategie für Q1 2024",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-03-15T14:30:00Z",
    comments: 5,
    milestone: {
      title: "Q1 2024",
      due_on: "2024-03-31T23:59:59Z"
    },
    reactions: {
      total_count: 8,
      "+1": 5,
      "-1": 0,
      laugh: 1,
      hooray: 2,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0
    }
  },
  "2": {
    state: "closed",
    labels: [
      { name: "done" },
      { name: "feature" }
    ],
    assignees: [
      {
        login: "annamusterfrau",
        avatar_url: "https://www.gravatar.com/avatar/11111111111111111111111111111111?d=mp"
      }
    ],
    title: "Neue Produktfunktion: Analytics Dashboard",
    body: "Entwicklung eines neuen Analytics Dashboards für Kunden",
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-02-28T16:45:00Z",
    comments: 12,
    milestone: {
      title: "Q1 2024",
      due_on: "2024-02-29T23:59:59Z"
    },
    reactions: {
      total_count: 15,
      "+1": 10,
      "-1": 0,
      laugh: 2,
      hooray: 3,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0
    }
  },
  "3": {
    state: "open",
    labels: [
      { name: "blocked" },
      { name: "urgent" }
    ],
    assignees: [
      {
        login: "johndoe",
        avatar_url: "https://www.gravatar.com/avatar/22222222222222222222222222222222?d=mp"
      }
    ],
    title: "Kritischer Bug: Datenverlust bei Export",
    body: "Behebung eines kritischen Bugs beim Datenexport",
    created_at: "2024-03-10T08:00:00Z",
    updated_at: "2024-03-15T11:20:00Z",
    comments: 8,
    milestone: {
      title: "Q1 2024",
      due_on: "2024-03-20T23:59:59Z"
    },
    reactions: {
      total_count: 6,
      "+1": 2,
      "-1": 1,
      laugh: 0,
      hooray: 0,
      confused: 3,
      heart: 0,
      rocket: 0,
      eyes: 0
    }
  }
};

// Mock-Daten für GitHub Comments
const mockComments: Record<string, GitHubComment[]> = {
  "1": [
    {
      id: 1,
      user: {
        login: "maxmustermann",
        avatar_url: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
      },
      body: "Erste Implementierung abgeschlossen",
      created_at: "2024-01-15T14:30:00Z",
      reactions: {
        total_count: 3,
        "+1": 2,
        "-1": 0,
        laugh: 0,
        hooray: 1,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0
      }
    }
  ],
  "2": [
    {
      id: 2,
      user: {
        login: "annamusterfrau",
        avatar_url: "https://www.gravatar.com/avatar/11111111111111111111111111111111?d=mp"
      },
      body: "Feature ist produktionsreif",
      created_at: "2024-02-28T15:00:00Z",
      reactions: {
        total_count: 5,
        "+1": 4,
        "-1": 0,
        laugh: 0,
        hooray: 1,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0
      }
    }
  ],
  "3": [
    {
      id: 3,
      user: {
        login: "johndoe",
        avatar_url: "https://www.gravatar.com/avatar/22222222222222222222222222222222?d=mp"
      },
      body: "Bug reproduziert, arbeite an der Lösung",
      created_at: "2024-03-11T09:15:00Z",
      reactions: {
        total_count: 2,
        "+1": 1,
        "-1": 0,
        laugh: 0,
        hooray: 0,
        confused: 1,
        heart: 0,
        rocket: 0,
        eyes: 0
      }
    }
  ]
};

// Mock-Funktionen
export async function fetchIssueStatus(issueUrl: string): Promise<GitHubIssue> {
  const match = issueUrl.match(/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
  if (!match) {
    throw new Error("Invalid GitHub issue URL");
  }

  const issueNumber = match[1];
  const issue = mockIssues[issueNumber];
  
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Simuliere Netzwerkverzögerung
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return issue;
}

export async function fetchIssueComments(issueUrl: string): Promise<GitHubComment[]> {
  const match = issueUrl.match(/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
  if (!match) {
    throw new Error("Invalid GitHub issue URL");
  }

  const issueNumber = match[1];
  const comments = mockComments[issueNumber] || [];
  
  // Simuliere Netzwerkverzögerung
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return comments;
} 