import { Solution, Problem } from '../types';
import { BaseScraper } from '../utils/baseScraper';

export class SolutionScraper extends BaseScraper {
  private readonly LEETCODE_BASE_URL = 'https://leetcode.com';

  async scrapeSolutions(problems: Problem[], solutionsPerProblem: number = 5): Promise<Solution[]> {
    await this.initialize();
    
    try {
      this.logger.info(`💡 Starting to scrape solutions for ${problems.length} problems`);
      
      const allSolutions: Solution[] = [];
      
      for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        
        try {
          this.logger.info(`🔍 Scraping solutions for problem ${i + 1}/${problems.length}: ${problem.title}`);
          
          const solutions = await this.retry(() => 
            this.scrapeProblemSolutions(problem, solutionsPerProblem)
          );
          
          allSolutions.push(...solutions);
          
          // Delay between problems
          await this.delay(this.config.delayBetweenRequests * 2);
          
        } catch (error) {
          this.logger.error(`❌ Failed to scrape solutions for problem: ${problem.title}`, error);
          continue;
        }
      }
      
      this.logger.success(`✅ Successfully scraped ${allSolutions.length} solutions`);
      return allSolutions;
      
    } finally {
      await this.cleanup();
    }
  }

  private async scrapeProblemSolutions(problem: Problem, limit: number): Promise<Solution[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Navigate to solutions page
      const solutionsUrl = `${this.LEETCODE_BASE_URL}/problems/${problem.slug}/solutions/`;
      await this.navigate(solutionsUrl);
      
      // Wait for solutions to load
      await this.page.waitForSelector('[data-key]', { timeout: 15000 });
      
      // Get solution links
      const solutionLinks = await this.page.evaluate((limit) => {
        const solutionElements = document.querySelectorAll('[data-key]');
        const links: string[] = [];
        
        for (let i = 0; i < Math.min(solutionElements.length, limit); i++) {
          const element = solutionElements[i];
          const linkElement = element.querySelector('a');
          if (linkElement) {
            const href = linkElement.getAttribute('href');
            if (href && href.includes('/solutions/')) {
              links.push(href);
            }
          }
        }
        
        return links;
      }, limit);
      
      const solutions: Solution[] = [];
      
      // Scrape each solution
      for (let i = 0; i < solutionLinks.length; i++) {
        try {
          const solutionUrl = this.LEETCODE_BASE_URL + solutionLinks[i];
          const solution = await this.scrapeSolutionDetails(problem, solutionUrl);
          
          if (solution) {
            solutions.push(solution);
          }
          
          await this.delay(this.config.delayBetweenRequests);
          
        } catch (error) {
          this.logger.warn(`⚠️ Failed to scrape solution ${i + 1}:`, error);
          continue;
        }
      }
      
      return solutions;
      
    } catch (error) {
      this.logger.error(`❌ Failed to scrape solutions for ${problem.slug}:`, error);
      return [];
    }
  }

  private async scrapeSolutionDetails(problem: Problem, solutionUrl: string): Promise<Solution | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.navigate(solutionUrl);
      
      // Wait for solution content to load
      await this.page.waitForSelector('[class*="content"]', { timeout: 10000 });
      
      const solutionData = await this.page.evaluate(() => {
        // Extract solution title
        const titleElement = document.querySelector('h1, h2, h3, [class*="title"]');
        const title = titleElement?.textContent?.trim() || 'Untitled Solution';
        
        // Extract author
        const authorElement = document.querySelector('[class*="author"], [class*="username"]');
        const author = authorElement?.textContent?.trim() || 'Anonymous';
        
        // Extract votes
        const voteElements = document.querySelectorAll('[class*="vote"], [class*="like"]');
        let votes = 0;
        voteElements.forEach((el: any) => {
          const text = el.textContent || '';
          const match = text.match(/\\d+/);
          if (match) {
            votes = Math.max(votes, parseInt(match[0]));
          }
        });
        
        // Extract code content
        const codeElements = document.querySelectorAll('pre, code, [class*="code"]');
        let content = '';
        let language = 'unknown';
        
        codeElements.forEach((el: any) => {
          const text = el.textContent?.trim();
          if (text && text.length > content.length) {
            content = text;
            
            // Try to detect language from class names or context
            const className = el.className || '';
            if (className.includes('python')) language = 'python';
            else if (className.includes('java')) language = 'java';
            else if (className.includes('cpp') || className.includes('c++')) language = 'cpp';
            else if (className.includes('javascript') || className.includes('js')) language = 'javascript';
            else if (className.includes('typescript') || className.includes('ts')) language = 'typescript';
            else if (className.includes('go')) language = 'go';
            else if (className.includes('rust')) language = 'rust';
            else if (className.includes('c#') || className.includes('csharp')) language = 'csharp';
          }
        });
        
        // Extract explanation/approach
        const explanationElements = document.querySelectorAll('p, div');
        let explanation = '';
        explanationElements.forEach((el: any) => {
          const text = el.textContent?.trim();
          if (text && text.length > 50 && !text.includes('class') && !text.includes('def ')) {
            explanation += text + '\\n';
          }
        });
        
        // Extract runtime and memory (often in performance sections)
        const performanceElements = document.querySelectorAll('[class*="performance"], [class*="runtime"], [class*="memory"]');
        let runtime = 'N/A';
        let memory = 'N/A';
        
        performanceElements.forEach((el: any) => {
          const text = el.textContent || '';
          if (text.includes('ms')) {
            const match = text.match(/(\\d+)\\s*ms/);
            if (match) runtime = match[1] + 'ms';
          }
          if (text.includes('MB')) {
            const match = text.match(/(\\d+\\.?\\d*)\\s*MB/);
            if (match) memory = match[1] + 'MB';
          }
        });
        
        return {
          title,
          content,
          language,
          runtime,
          memory,
          author,
          votes,
          explanation: explanation.trim()
        };
      });
      
      const solution: Solution = {
        problemId: problem.id,
        title: solutionData.title,
        content: solutionData.content,
        language: solutionData.language,
        runtime: solutionData.runtime,
        memory: solutionData.memory,
        author: solutionData.author,
        votes: solutionData.votes,
        approach: solutionData.explanation,
        complexity: {
          time: 'N/A', // Would need more specific parsing
          space: 'N/A'
        },
        explanation: solutionData.explanation,
        url: solutionUrl,
        scraped_at: new Date()
      };
      
      return solution;
      
    } catch (error) {
      this.logger.error(`❌ Failed to scrape solution details from ${solutionUrl}:`, error);
      return null;
    }
  }
}
