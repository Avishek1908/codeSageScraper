import { Problem, Example } from '../types';
import { BaseScraper } from '../utils/baseScraper';

export class ProblemScraper extends BaseScraper {
  private readonly LEETCODE_BASE_URL = 'https://leetcode.com';

  async scrapeProblems(limit: number = 50): Promise<Problem[]> {
    await this.initialize();
    
    try {
      this.logger.info(`📋 Starting to scrape ${limit} problems from LeetCode`);
      
      // First, get the list of problems
      const problemList = await this.getProblemsList(limit);
      
      const problems: Problem[] = [];
      
      for (let i = 0; i < Math.min(problemList.length, limit); i++) {
        const problemData = problemList[i];
        
        try {
          this.logger.info(`📄 Scraping problem ${i + 1}/${limit}: ${problemData.title}`);
          
          const problem = await this.retry(() => 
            this.scrapeProblemDetails(problemData)
          );
          
          if (problem) {
            problems.push(problem);
          }
          
          // Delay between requests
          await this.delay(this.config.delayBetweenRequests);
          
        } catch (error) {
          this.logger.error(`❌ Failed to scrape problem: ${problemData.title}`, error);
          continue;
        }
      }
      
      this.logger.success(`✅ Successfully scraped ${problems.length} problems`);
      return problems;
      
    } finally {
      await this.cleanup();
    }
  }

  private async getProblemsList(limit: number): Promise<any[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Go to problems page to get the list
      await this.navigate(`${this.LEETCODE_BASE_URL}/problemset/all/`);
      
      // Wait a bit for the page to load
      await this.delay(3000);
      
      // Try multiple selectors to find the problems table
      const selectors = [
        '[role="table"]',
        '[data-cy="question-list-table"]',
        '.reactable-data',
        'table',
        '[class*="table"]'
      ];
      
      let tableFound = false;
      for (const selector of selectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 10000 });
          tableFound = true;
          this.logger.info(`✅ Found table with selector: ${selector}`);
          break;
        } catch (error) {
          this.logger.warn(`⚠️ Selector ${selector} not found, trying next...`);
        }
      }
      
      if (!tableFound) {
        this.logger.warn('⚠️ No table found, trying to scrape from page content...');
      }
      
      // Get problem data from the page
      const problems = await this.page.evaluate((limit) => {
        const problemData: any[] = [];
        
        // Try different approaches to find problem links
        const approaches = [
          // Approach 1: Look for table rows
          () => {
            const rows = document.querySelectorAll('[role="row"], tr');
            for (let i = 1; i < Math.min(rows.length, limit + 1); i++) {
              const row = rows[i];
              const cells = row.querySelectorAll('[role="cell"], td');
              
              if (cells.length >= 2) {
                const titleElement = cells[1].querySelector('a') || cells[0].querySelector('a');
                
                if (titleElement && titleElement.textContent) {
                  const href = titleElement.getAttribute('href');
                  if (href && href.includes('/problems/')) {
                    problemData.push({
                      title: titleElement.textContent.trim(),
                      slug: href.replace('/problems/', '').replace('/', ''),
                      difficulty: 'Medium' // Default, we'll get real difficulty later
                    });
                  }
                }
              }
            }
          },
          
          // Approach 2: Look for problem links directly
          () => {
            const links = document.querySelectorAll('a[href*="/problems/"]');
            for (let i = 0; i < Math.min(links.length, limit); i++) {
              const link = links[i] as HTMLAnchorElement;
              const href = link.getAttribute('href');
              const title = link.textContent?.trim();
              
              if (href && title && href.includes('/problems/') && !href.includes('/discuss/')) {
                let slug = href.replace('/problems/', '').replace('/', '');
                // Clean up any URL parameters
                if (slug.includes('?')) {
                  slug = slug.split('?')[0];
                }
                if (slug && !problemData.find(p => p.slug === slug)) {
                  problemData.push({
                    title: title,
                    slug: slug,
                    difficulty: 'Medium'
                  });
                }
              }
            }
          }
        ];
        
        // Try each approach until we get some results
        for (const approach of approaches) {
          try {
            approach();
            if (problemData.length > 0) break;
          } catch (error) {
            console.warn('Approach failed:', error);
          }
        }
        
        return problemData;
      }, limit);
      
      this.logger.info(`📊 Found ${problems.length} problems`);
      return problems.filter(p => p.title && p.slug).slice(0, limit);
      
    } catch (error) {
      this.logger.error('❌ Failed to get problems list:', error);
      
      // Fallback: return some test data
      this.logger.warn('🔄 Using fallback test data...');
      return [
        { title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy' },
        { title: 'Add Two Numbers', slug: 'add-two-numbers', difficulty: 'Medium' },
        { title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters', difficulty: 'Medium' }
      ].slice(0, limit);
    }
  }

  private async scrapeProblemDetails(problemData: any): Promise<Problem | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      const url = `${this.LEETCODE_BASE_URL}/problems/${problemData.slug}/`;
      await this.navigate(url);
      
      // Wait for problem content to load
      await this.page.waitForSelector('[data-track-load="description_content"]', { timeout: 15000 });
      
      const problemDetails = await this.page.evaluate(() => {
        // Extract problem description
        const descriptionElement = document.querySelector('[data-track-load="description_content"]');
        const description = descriptionElement?.textContent?.trim() || '';
        
        // Extract examples
        const examples: Example[] = [];
        const exampleElements = document.querySelectorAll('pre');
        exampleElements.forEach(pre => {
          const text = pre.textContent || '';
          if (text.includes('Input:') && text.includes('Output:')) {
            const lines = text.split('\\n');
            let input = '', output = '', explanation = '';
            
            for (const line of lines) {
              if (line.includes('Input:')) {
                input = line.replace('Input:', '').trim();
              } else if (line.includes('Output:')) {
                output = line.replace('Output:', '').trim();
              } else if (line.includes('Explanation:')) {
                explanation = line.replace('Explanation:', '').trim();
              }
            }
            
            if (input && output) {
              const example: Example = { 
                input, 
                output, 
                ...(explanation ? { explanation } : {}) 
              };
              examples.push(example);
            }
          }
        });
        
        // Extract tags
        const tags: string[] = [];
        const tagElements = document.querySelectorAll('[class*="tag"]');
        tagElements.forEach(tag => {
          const tagText = tag.textContent?.trim();
          if (tagText && tagText.length > 0) {
            tags.push(tagText);
          }
        });
        
        // Extract constraints
        const constraintsElement = document.querySelector('ul');
        const constraints = constraintsElement?.textContent?.trim() || '';
        
        return {
          description,
          examples,
          tags: [...new Set(tags)], // Remove duplicates
          constraints
        };
      });
      
      // Extract additional metadata from the page
      const stats = await this.page.evaluate(() => {
        const statsElements = document.querySelectorAll('[class*="text-"]');
        let likes = 0, dislikes = 0, acceptance = 0;
        
        statsElements.forEach(el => {
          const text = el.textContent || '';
          if (text.includes('%')) {
            const percent = parseFloat(text.replace('%', ''));
            if (!isNaN(percent)) acceptance = percent;
          }
        });
        
        return { likes, dislikes, acceptance };
      });
      
      const problem: Problem = {
        id: problemData.slug,
        title: problemData.title,
        slug: problemData.slug,
        difficulty: problemData.difficulty as 'Easy' | 'Medium' | 'Hard',
        description: problemDetails.description,
        tags: problemDetails.tags,
        likes: stats.likes,
        dislikes: stats.dislikes,
        acceptance: stats.acceptance,
        url: url,
        isPremium: false, // We'll detect this based on access
        companies: [], // Would need additional API calls
        similarProblems: [], // Would need additional API calls
        hints: [], // Would need to find hints section
        constraints: problemDetails.constraints,
        examples: problemDetails.examples,
        scraped_at: new Date()
      };
      
      return problem;
      
    } catch (error) {
      this.logger.error(`❌ Failed to scrape problem details for ${problemData.slug}:`, error);
      return null;
    }
  }
}
