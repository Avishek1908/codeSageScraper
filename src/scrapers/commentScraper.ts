import { Comment, Problem } from '../types';
import { BaseScraper } from '../utils/baseScraper';

export class CommentScraper extends BaseScraper {
  private readonly LEETCODE_BASE_URL = 'https://leetcode.com';

  async scrapeComments(problems: Problem[], commentsPerProblem: number = 20): Promise<Comment[]> {
    await this.initialize();
    
    try {
      this.logger.info(`💬 Starting to scrape comments for ${problems.length} problems`);
      
      const allComments: Comment[] = [];
      
      for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        
        try {
          this.logger.info(`🗨️ Scraping comments for problem ${i + 1}/${problems.length}: ${problem.title}`);
          
          const comments = await this.retry(() => 
            this.scrapeProblemComments(problem, commentsPerProblem)
          );
          
          allComments.push(...comments);
          
          // Delay between problems
          await this.delay(this.config.delayBetweenRequests * 2);
          
        } catch (error) {
          this.logger.error(`❌ Failed to scrape comments for problem: ${problem.title}`, error);
          continue;
        }
      }
      
      this.logger.success(`✅ Successfully scraped ${allComments.length} comments`);
      return allComments;
      
    } finally {
      await this.cleanup();
    }
  }

  private async scrapeProblemComments(problem: Problem, limit: number): Promise<Comment[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Navigate to discuss page for the problem
      const discussUrl = `${this.LEETCODE_BASE_URL}/problems/${problem.slug}/discuss/`;
      await this.navigate(discussUrl);
      
      // Wait for discussions to load
      await this.page.waitForSelector('[class*="discuss"], [class*="topic"]', { timeout: 15000 });
      
      // Get discussion topic links
      const topicLinks = await this.page.evaluate((limit) => {
        const topicElements = document.querySelectorAll('a[href*="/discuss/"]');
        const links: string[] = [];
        
        for (let i = 0; i < Math.min(topicElements.length, limit); i++) {
          const element = topicElements[i] as HTMLAnchorElement;
          const href = element.getAttribute('href');
          if (href && href.includes('/discuss/')) {
            links.push(href);
          }
        }
        
        return links;
      }, Math.min(limit, 10)); // Limit number of topics to visit
      
      const comments: Comment[] = [];
      
      // Scrape comments from each discussion topic
      for (let i = 0; i < topicLinks.length; i++) {
        try {
          const topicUrl = this.LEETCODE_BASE_URL + topicLinks[i];
          const topicComments = await this.scrapeTopicComments(problem, topicUrl);
          
          comments.push(...topicComments);
          
          await this.delay(this.config.delayBetweenRequests);
          
        } catch (error) {
          this.logger.warn(`⚠️ Failed to scrape topic ${i + 1}:`, error);
          continue;
        }
      }
      
      return comments.slice(0, limit); // Ensure we don't exceed the limit
      
    } catch (error) {
      this.logger.error(`❌ Failed to scrape comments for ${problem.slug}:`, error);
      return [];
    }
  }

  private async scrapeTopicComments(problem: Problem, topicUrl: string): Promise<Comment[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.navigate(topicUrl);
      
      // Wait for comments to load
      await this.page.waitForSelector('[class*="comment"], [class*="post"]', { timeout: 10000 });
      
      const comments = await this.page.evaluate(() => {
        const commentElements = document.querySelectorAll('[class*="comment"], [class*="post"], [class*="reply"]');
        const extractedComments: any[] = [];
        
        commentElements.forEach((element: any, index: number) => {
          try {
            // Extract author
            const authorElement = element.querySelector('[class*="author"], [class*="username"], [class*="user"]');
            const author = authorElement?.textContent?.trim() || 'Anonymous';
            
            // Extract content
            const contentElement = element.querySelector('[class*="content"], [class*="text"], [class*="body"]');
            let content = contentElement?.textContent?.trim() || '';
            
            // If no specific content element, try the element itself
            if (!content) {
              content = element.textContent?.trim() || '';
            }
            
            // Skip if content is too short or looks like metadata
            if (content.length < 10 || content.includes('edited') || content.includes('ago')) {
              return;
            }
            
            // Extract votes
            const voteElements = element.querySelectorAll('[class*="vote"], [class*="like"], [class*="point"]');
            let votes = 0;
            voteElements.forEach((voteEl: any) => {
              const text = voteEl.textContent || '';
              const match = text.match(/\\d+/);
              if (match) {
                votes = Math.max(votes, parseInt(match[0]));
              }
            });
            
            // Extract timestamp
            const timeElements = element.querySelectorAll('[class*="time"], [class*="date"], [title*="ago"]');
            let timestamp = new Date();
            timeElements.forEach((timeEl: any) => {
              const text = timeEl.textContent || timeEl.getAttribute('title') || '';
              if (text.includes('ago')) {
                // Parse relative time (e.g., "2 hours ago", "3 days ago")
                const match = text.match(/(\\d+)\\s*(minute|hour|day|week|month|year)s?\\s*ago/);
                if (match) {
                  const amount = parseInt(match[1]);
                  const unit = match[2];
                  const now = new Date();
                  
                  switch (unit) {
                    case 'minute':
                      timestamp = new Date(now.getTime() - amount * 60 * 1000);
                      break;
                    case 'hour':
                      timestamp = new Date(now.getTime() - amount * 60 * 60 * 1000);
                      break;
                    case 'day':
                      timestamp = new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
                      break;
                    case 'week':
                      timestamp = new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
                      break;
                    case 'month':
                      timestamp = new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
                      break;
                    case 'year':
                      timestamp = new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
                      break;
                  }
                }
              }
            });
            
            if (content.length >= 10) {
              extractedComments.push({
                id: `comment_${index}_${Date.now()}`,
                author,
                content,
                votes,
                timestamp,
                replies: [] // We'll handle nested replies in a future version
              });
            }
            
          } catch (error) {
            console.warn('Error processing comment element:', error);
          }
        });
        
        return extractedComments;
      });
      
      // Convert to proper Comment objects
      const formattedComments: Comment[] = comments.map(comment => ({
        id: comment.id,
        problemId: problem.id,
        author: comment.author,
        content: comment.content,
        votes: comment.votes,
        replies: [],
        timestamp: new Date(comment.timestamp),
        scraped_at: new Date()
      }));
      
      return formattedComments;
      
    } catch (error) {
      this.logger.error(`❌ Failed to scrape topic comments from ${topicUrl}:`, error);
      return [];
    }
  }
}
