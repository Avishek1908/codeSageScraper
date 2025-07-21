export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  tags: string[];
  likes: number;
  dislikes: number;
  acceptance: number;
  url: string;
  isPremium: boolean;
  companies: string[];
  similarProblems: string[];
  hints: string[];
  constraints: string;
  examples: Example[];
  scraped_at: Date;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface Solution {
  problemId: string;
  title: string;
  content: string;
  language: string;
  runtime: string;
  memory: string;
  author: string;
  votes: number;
  approach: string;
  complexity: {
    time: string;
    space: string;
  };
  explanation: string;
  url: string;
  scraped_at: Date;
}

export interface Comment {
  id: string;
  problemId: string;
  solutionId?: string;
  author: string;
  content: string;
  votes: number;
  replies: Comment[];
  timestamp: Date;
  scraped_at: Date;
}

export interface ScrapingConfig {
  maxConcurrency: number;
  delayBetweenRequests: number;
  timeout: number;
  retries: number;
  userAgent: string;
  headless: boolean;
}

export interface DatasetOutput {
  problems: Problem[];
  solutions: Solution[];
  comments: Comment[];
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'jsonl';
  outputDir: string;
  fileName?: string;
  includeMetadata: boolean;
}
