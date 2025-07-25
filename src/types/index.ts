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

// Editorial-specific types for structured scraping
export interface LeetCodeEditorialSolution {
  problemId: string;
  title: string;
  extractedAt: string;
  sourceUrl: string;
  videoSolution: VideoSolution;
  approaches: EditorialApproach[];
  iframeImplementations: IframeImplementation[];
  topComments: TopComments;
  summary: EditorialSummary;
  debugInfo: any;
}

export interface VideoSolution {
  found: boolean;
  description: string;
  iframeUrl: string;
}

export interface EditorialApproach {
  title: string;
  algorithm: string;
  implementation: string;
  complexityAnalysis: string;
  codeBlocks: string[];
  iframeUrl: string;
  fullContent: string;
}

export interface IframeImplementation {
  src: string;
  id: string;
  content: string;
}

export interface TopComments {
  [key: string]: string; // comment1, comment2, etc.
}

export interface EditorialSummary {
  totalApproaches: number;
  totalImplementations: number;
  hasVideoSolution: boolean;
  contentLength: number;
  totalComments: number;
}
