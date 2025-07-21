import * as fs from 'fs-extra';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { DatasetOutput, ExportOptions, Problem, Solution, Comment } from '../types';
import { Logger } from '../utils/logger';

export class DatasetExporter {
  private logger: Logger;
  private outputDir: string;

  constructor(outputDir: string = './data') {
    this.logger = new Logger();
    this.outputDir = outputDir;
  }

  async exportDataset(
    dataset: DatasetOutput, 
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const exportOptions: ExportOptions = {
      format: 'json',
      outputDir: this.outputDir,
      fileName: `leetcode_dataset_${new Date().toISOString().split('T')[0]}`,
      includeMetadata: true,
      ...options
    };

    try {
      // Ensure output directory exists
      await fs.ensureDir(exportOptions.outputDir);
      
      this.logger.info(`📊 Exporting dataset in ${exportOptions.format} format...`);
      
      switch (exportOptions.format) {
        case 'json':
          await this.exportJSON(dataset, exportOptions);
          break;
        case 'csv':
          await this.exportCSV(dataset, exportOptions);
          break;
        case 'jsonl':
          await this.exportJSONL(dataset, exportOptions);
          break;
        default:
          throw new Error(`Unsupported export format: ${exportOptions.format}`);
      }
      
      // Export metadata
      if (exportOptions.includeMetadata) {
        await this.exportMetadata(dataset, exportOptions);
      }
      
      this.logger.success(`✅ Dataset exported successfully to ${exportOptions.outputDir}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to export dataset:', error);
      throw error;
    }
  }

  private async exportJSON(dataset: DatasetOutput, options: ExportOptions): Promise<void> {
    const filePath = path.join(options.outputDir, `${options.fileName}.json`);
    
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_problems: dataset.problems.length,
        total_solutions: dataset.solutions.length,
        total_comments: dataset.comments.length,
        version: '1.0.0'
      },
      problems: dataset.problems,
      solutions: dataset.solutions,
      comments: dataset.comments
    };
    
    await fs.writeJson(filePath, exportData, { spaces: 2 });
    this.logger.info(`📄 JSON file saved: ${filePath}`);
  }

  private async exportJSONL(dataset: DatasetOutput, options: ExportOptions): Promise<void> {
    // Export problems
    const problemsPath = path.join(options.outputDir, `${options.fileName}_problems.jsonl`);
    const problemsContent = dataset.problems.map(p => JSON.stringify(p)).join('\\n');
    await fs.writeFile(problemsPath, problemsContent);
    
    // Export solutions
    const solutionsPath = path.join(options.outputDir, `${options.fileName}_solutions.jsonl`);
    const solutionsContent = dataset.solutions.map(s => JSON.stringify(s)).join('\\n');
    await fs.writeFile(solutionsPath, solutionsContent);
    
    // Export comments
    const commentsPath = path.join(options.outputDir, `${options.fileName}_comments.jsonl`);
    const commentsContent = dataset.comments.map(c => JSON.stringify(c)).join('\\n');
    await fs.writeFile(commentsPath, commentsContent);
    
    this.logger.info(`📄 JSONL files saved: ${problemsPath}, ${solutionsPath}, ${commentsPath}`);
  }

  private async exportCSV(dataset: DatasetOutput, options: ExportOptions): Promise<void> {
    // Export problems to CSV
    await this.exportProblemsCSV(dataset.problems, options);
    
    // Export solutions to CSV
    await this.exportSolutionsCSV(dataset.solutions, options);
    
    // Export comments to CSV
    await this.exportCommentsCSV(dataset.comments, options);
  }

  private async exportProblemsCSV(problems: Problem[], options: ExportOptions): Promise<void> {
    const filePath = path.join(options.outputDir, `${options.fileName}_problems.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: 'Title' },
        { id: 'slug', title: 'Slug' },
        { id: 'difficulty', title: 'Difficulty' },
        { id: 'description', title: 'Description' },
        { id: 'tags', title: 'Tags' },
        { id: 'acceptance', title: 'Acceptance' },
        { id: 'url', title: 'URL' },
        { id: 'isPremium', title: 'Is Premium' },
        { id: 'constraints', title: 'Constraints' },
        { id: 'scraped_at', title: 'Scraped At' }
      ]
    });
    
    const csvData = problems.map(problem => ({
      ...problem,
      tags: problem.tags.join('; '),
      examples: JSON.stringify(problem.examples),
      companies: problem.companies.join('; '),
      similarProblems: problem.similarProblems.join('; '),
      hints: problem.hints.join('; ')
    }));
    
    await csvWriter.writeRecords(csvData);
    this.logger.info(`📊 Problems CSV saved: ${filePath}`);
  }

  private async exportSolutionsCSV(solutions: Solution[], options: ExportOptions): Promise<void> {
    const filePath = path.join(options.outputDir, `${options.fileName}_solutions.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'problemId', title: 'Problem ID' },
        { id: 'title', title: 'Title' },
        { id: 'content', title: 'Content' },
        { id: 'language', title: 'Language' },
        { id: 'runtime', title: 'Runtime' },
        { id: 'memory', title: 'Memory' },
        { id: 'author', title: 'Author' },
        { id: 'votes', title: 'Votes' },
        { id: 'approach', title: 'Approach' },
        { id: 'explanation', title: 'Explanation' },
        { id: 'url', title: 'URL' },
        { id: 'scraped_at', title: 'Scraped At' }
      ]
    });
    
    const csvData = solutions.map(solution => ({
      ...solution,
      complexity: JSON.stringify(solution.complexity)
    }));
    
    await csvWriter.writeRecords(csvData);
    this.logger.info(`📊 Solutions CSV saved: ${filePath}`);
  }

  private async exportCommentsCSV(comments: Comment[], options: ExportOptions): Promise<void> {
    const filePath = path.join(options.outputDir, `${options.fileName}_comments.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'problemId', title: 'Problem ID' },
        { id: 'solutionId', title: 'Solution ID' },
        { id: 'author', title: 'Author' },
        { id: 'content', title: 'Content' },
        { id: 'votes', title: 'Votes' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'scraped_at', title: 'Scraped At' }
      ]
    });
    
    const csvData = comments.map(comment => ({
      ...comment,
      replies: comment.replies.length
    }));
    
    await csvWriter.writeRecords(csvData);
    this.logger.info(`📊 Comments CSV saved: ${filePath}`);
  }

  private async exportMetadata(dataset: DatasetOutput, options: ExportOptions): Promise<void> {
    const metadataPath = path.join(options.outputDir, `${options.fileName}_metadata.json`);
    
    const metadata = {
      export_info: {
        exported_at: new Date().toISOString(),
        format: options.format,
        version: '1.0.0'
      },
      statistics: {
        total_problems: dataset.problems.length,
        total_solutions: dataset.solutions.length,
        total_comments: dataset.comments.length,
        difficulty_breakdown: this.getDifficultyBreakdown(dataset.problems),
        language_breakdown: this.getLanguageBreakdown(dataset.solutions),
        tag_breakdown: this.getTagBreakdown(dataset.problems)
      },
      data_quality: {
        problems_with_examples: dataset.problems.filter(p => p.examples.length > 0).length,
        solutions_with_code: dataset.solutions.filter(s => s.content.length > 50).length,
        comments_with_votes: dataset.comments.filter(c => c.votes > 0).length
      }
    };
    
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    this.logger.info(`📋 Metadata saved: ${metadataPath}`);
  }

  private getDifficultyBreakdown(problems: Problem[]): Record<string, number> {
    return problems.reduce((acc, problem) => {
      acc[problem.difficulty] = (acc[problem.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getLanguageBreakdown(solutions: Solution[]): Record<string, number> {
    return solutions.reduce((acc, solution) => {
      acc[solution.language] = (acc[solution.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTagBreakdown(problems: Problem[]): Record<string, number> {
    const tagCount: Record<string, number> = {};
    
    problems.forEach(problem => {
      problem.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    return tagCount;
  }

  async exportForLLMTraining(dataset: DatasetOutput, outputDir?: string): Promise<void> {
    const exportDir = outputDir || path.join(this.outputDir, 'llm_training');
    await fs.ensureDir(exportDir);
    
    this.logger.info('🤖 Preparing dataset for LLM training...');
    
    // Create training format: problem-solution pairs
    const trainingData = [];
    
    for (const problem of dataset.problems) {
      const problemSolutions = dataset.solutions.filter(s => s.problemId === problem.id);
      const problemComments = dataset.comments.filter(c => c.problemId === problem.id);
      
      // Create training examples
      for (const solution of problemSolutions) {
        const trainingExample = {
          instruction: `Solve the following LeetCode problem:\\n\\nTitle: ${problem.title}\\nDifficulty: ${problem.difficulty}\\n\\nDescription:\\n${problem.description}`,
          input: problem.examples.map(ex => `Input: ${ex.input}\\nOutput: ${ex.output}${ex.explanation ? '\\nExplanation: ' + ex.explanation : ''}`).join('\\n\\n'),
          output: `Language: ${solution.language}\\n\\nSolution:\\n${solution.content}\\n\\nExplanation:\\n${solution.explanation}`,
          metadata: {
            problem_id: problem.id,
            difficulty: problem.difficulty,
            tags: problem.tags,
            language: solution.language,
            votes: solution.votes
          }
        };
        
        trainingData.push(trainingExample);
      }
      
      // Add comment insights
      if (problemComments.length > 0) {
        const topComments = problemComments
          .filter(c => c.votes > 0 && c.content.length > 20)
          .sort((a, b) => b.votes - a.votes)
          .slice(0, 3);
        
        if (topComments.length > 0) {
          const commentExample = {
            instruction: `Provide insights and discussion points for the following LeetCode problem:\\n\\nTitle: ${problem.title}\\nDifficulty: ${problem.difficulty}\\n\\nDescription:\\n${problem.description}`,
            input: 'What are some key insights, alternative approaches, or common pitfalls for this problem?',
            output: topComments.map(c => `• ${c.content} (${c.votes} votes)`).join('\\n'),
            metadata: {
              problem_id: problem.id,
              type: 'discussion',
              comment_count: problemComments.length
            }
          };
          
          trainingData.push(commentExample);
        }
      }
    }
    
    // Export training data
    const trainingPath = path.join(exportDir, 'training_data.jsonl');
    const trainingContent = trainingData.map(item => JSON.stringify(item)).join('\\n');
    await fs.writeFile(trainingPath, trainingContent);
    
    // Export summary
    const summaryPath = path.join(exportDir, 'dataset_summary.json');
    const summary = {
      total_training_examples: trainingData.length,
      problems_covered: dataset.problems.length,
      solutions_included: dataset.solutions.length,
      comments_included: dataset.comments.length,
      difficulty_distribution: this.getDifficultyBreakdown(dataset.problems),
      language_distribution: this.getLanguageBreakdown(dataset.solutions),
      created_at: new Date().toISOString()
    };
    
    await fs.writeJson(summaryPath, summary, { spaces: 2 });
    
    this.logger.success(`🤖 LLM training dataset exported: ${trainingPath}`);
    this.logger.info(`📊 Dataset summary: ${summaryPath}`);
  }
}
