import { Page } from 'playwright';
import { BaseScraper } from '../utils/baseScraper';
import { Logger } from '../utils/logger';
import { 
    LeetCodeEditorialSolution, 
    EditorialApproach, 
    VideoSolution, 
    IframeImplementation,
    TopComments,
    EditorialSummary 
} from '../types';

/**
 * StructuredEditorialScraper - Extracts LeetCode editorial content in a clean, structured format
 * Based on the format shown in data/complete_two_sum_editorial.json
 */
export class StructuredEditorialScraper extends BaseScraper {

    constructor() {
        super();
    }

    /**
     * Scrape a complete editorial solution in structured format
     */
    async scrapeStructuredEditorial(page: Page, problemUrl: string): Promise<LeetCodeEditorialSolution> {
        this.logger.info(`Starting structured editorial scrape for: ${problemUrl}`);
        
        try {
            // Navigate to editorial page
            const editorialUrl = problemUrl.includes('/editorial/') 
                ? problemUrl 
                : `${problemUrl.replace(/\/$/, '')}/editorial/`;
            
            await page.goto(editorialUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            await this.delay(2000); // Wait for dynamic content

            // Extract basic problem info
            const problemId = this.extractProblemId(problemUrl);
            const title = await this.extractTitle(page);

            // Extract video solution
            const videoSolution = await this.extractVideoSolution(page);

            // Extract approaches
            const approaches = await this.extractApproaches(page);

            // Extract iframe implementations
            const iframeImplementations = await this.extractIframeImplementations(page);

            // Extract top comments
            const topComments = await this.extractTopComments(page);

            // Create summary
            const summary = this.createSummary(approaches, iframeImplementations, videoSolution, topComments);

            // Create debug info
            const debugInfo = await this.createDebugInfo(page);

            const solution: LeetCodeEditorialSolution = {
                problemId,
                title: `Complete Editorial Solution: ${title}`,
                extractedAt: new Date().toISOString(),
                sourceUrl: editorialUrl,
                videoSolution,
                approaches,
                iframeImplementations,
                topComments,
                summary,
                debugInfo
            };

            this.logger.info(`Successfully extracted structured editorial for ${problemId}`);
            return solution;

        } catch (error) {
            this.logger.error(`Error scraping structured editorial: ${error}`);
            throw error;
        }
    }

    /**
     * Extract video solution information
     */
    private async extractVideoSolution(page: Page): Promise<VideoSolution> {
        try {
            // Look for video solution indicators
            const videoIframe = await page.$('iframe[src*="vimeo"], iframe[src*="youtube"], iframe[src*="video"]');
            
            if (videoIframe) {
                const iframeUrl = await videoIframe.getAttribute('src') || '';
                return {
                    found: true,
                    description: "Video Solution",
                    iframeUrl
                };
            }

            // Check for video solution text/button
            const videoText = await page.$('text="Video Solution"');
            if (videoText) {
                return {
                    found: true,
                    description: "Video Solution",
                    iframeUrl: ""
                };
            }

            return { found: false, description: "", iframeUrl: "" };
        } catch (error) {
            this.logger.warn(`Error extracting video solution: ${error}`);
            return { found: false, description: "", iframeUrl: "" };
        }
    }

    /**
     * Extract structured approaches from the editorial
     */
    private async extractApproaches(page: Page): Promise<EditorialApproach[]> {
        const approaches: EditorialApproach[] = [];

        try {
            // Look for approach headings (h2, h3, etc.)
            const approachElements = await page.$$('h2, h3, h4');
            
            for (let i = 0; i < approachElements.length; i++) {
                const element = approachElements[i];
                const titleText = await element.textContent();
                
                if (titleText && titleText.toLowerCase().includes('approach')) {
                    const approach = await this.extractSingleApproach(page, element, i);
                    if (approach) {
                        approaches.push(approach);
                    }
                }
            }

            return approaches;
        } catch (error) {
            this.logger.warn(`Error extracting approaches: ${error}`);
            return [];
        }
    }

    /**
     * Extract a single approach section
     */
    private async extractSingleApproach(page: Page, titleElement: any, index: number): Promise<EditorialApproach | null> {
        try {
            const title = await titleElement.textContent() || `Approach ${index + 1}`;
            
            // Get content between this heading and the next
            const content = await page.evaluate((el) => {
                const sections = { algorithm: '', implementation: '', complexityAnalysis: '', fullContent: '' };
                let currentElement = el.nextElementSibling;
                let fullText = '';
                
                while (currentElement && !['H1', 'H2', 'H3', 'H4'].includes(currentElement.tagName)) {
                    const text = currentElement.textContent?.trim() || '';
                    fullText += text + '\n';
                    
                    // Categorize content based on keywords
                    const lowerText = text.toLowerCase();
                    if (lowerText.includes('algorithm') || lowerText.includes('intuition')) {
                        sections.algorithm = text;
                    } else if (lowerText.includes('implementation') || lowerText.includes('code')) {
                        sections.implementation = text;
                    } else if (lowerText.includes('complexity') || lowerText.includes('time complexity') || lowerText.includes('space complexity')) {
                        sections.complexityAnalysis = text;
                    }
                    
                    currentElement = currentElement.nextElementSibling;
                }
                
                sections.fullContent = fullText.trim();
                return sections;
            }, titleElement);

            return {
                title: title.trim(),
                algorithm: content.algorithm || "Algorithm",
                implementation: content.implementation || "Implementation", 
                complexityAnalysis: content.complexityAnalysis || "Complexity Analysis",
                codeBlocks: [], // Will be filled by iframe implementations
                iframeUrl: "",
                fullContent: content.fullContent
            };

        } catch (error) {
            this.logger.warn(`Error extracting single approach: ${error}`);
            return null;
        }
    }

    /**
     * Extract iframe implementations (code playgrounds)
     */
    private async extractIframeImplementations(page: Page): Promise<IframeImplementation[]> {
        const implementations: IframeImplementation[] = [];

        try {
            const iframes = await page.$$('iframe[src*="playground"], iframe[src*="leetcode.com"]');
            
            for (let i = 0; i < iframes.length; i++) {
                const iframe = iframes[i];
                const src = await iframe.getAttribute('src') || '';
                
                if (src.includes('playground') || src.includes('shared')) {
                    // Try to extract code content from iframe
                    const content = await this.extractIframeContent(page, iframe, i);
                    
                    implementations.push({
                        src,
                        id: `iframe-${i + 1}`,
                        content
                    });
                }
            }

            return implementations;
        } catch (error) {
            this.logger.warn(`Error extracting iframe implementations: ${error}`);
            return [];
        }
    }

    /**
     * Extract content from iframe (if accessible)
     */
    private async extractIframeContent(page: Page, iframe: any, index: number): Promise<string> {
        try {
            // Since iframes are often cross-origin, we'll return a placeholder
            // In a real implementation, you might need to navigate to the iframe URL
            return `// Code implementation ${index + 1}\n// Content from iframe playground`;
        } catch (error) {
            return `// Unable to extract iframe content: ${error}`;
        }
    }

    /**
     * Extract top comments from the editorial page
     */
    private async extractTopComments(page: Page): Promise<TopComments> {
        const comments: TopComments = {};

        try {
            // Look for comment sections
            const commentElements = await page.$$('[class*="comment"], [data-cy*="comment"], .discussion-item');
            
            let commentCount = 0;
            for (let i = 0; i < Math.min(commentElements.length, 5); i++) {
                const element = commentElements[i];
                const commentText = await element.textContent();
                
                if (commentText && commentText.trim().length > 10) {
                    commentCount++;
                    comments[`comment${commentCount}`] = this.cleanCommentText(commentText.trim());
                }
            }

            // If no structured comments found, try generic text extraction
            if (commentCount === 0) {
                const textElements = await page.$$('p, div');
                for (let i = 0; i < Math.min(textElements.length, 5) && commentCount < 5; i++) {
                    const text = await textElements[i].textContent();
                    if (text && this.looksLikeComment(text)) {
                        commentCount++;
                        comments[`comment${commentCount}`] = this.cleanCommentText(text.trim());
                    }
                }
            }

            return comments;
        } catch (error) {
            this.logger.warn(`Error extracting top comments: ${error}`);
            return {};
        }
    }

    /**
     * Clean comment text by removing extra whitespace and formatting
     */
    private cleanCommentText(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .replace(/Read more\d*/, '')
            .replace(/Show \d+ Replies?Reply/, '')
            .trim();
    }

    /**
     * Check if text looks like a comment
     */
    private looksLikeComment(text: string): boolean {
        const commentIndicators = [
            'class Solution',
            'def ',
            'function',
            'algorithm',
            'approach',
            'time complexity',
            'space complexity',
            'leetcode',
            'solution'
        ];
        
        const lowerText = text.toLowerCase();
        return commentIndicators.some(indicator => lowerText.includes(indicator)) && text.length > 20;
    }

    /**
     * Create summary statistics
     */
    private createSummary(
        approaches: EditorialApproach[],
        implementations: IframeImplementation[],
        videoSolution: VideoSolution,
        comments: TopComments
    ): EditorialSummary {
        return {
            totalApproaches: approaches.length,
            totalImplementations: implementations.length,
            hasVideoSolution: videoSolution.found,
            contentLength: 0, // Can be calculated based on total content
            totalComments: Object.keys(comments).length
        };
    }

    /**
     * Create debug information
     */
    private async createDebugInfo(page: Page): Promise<any> {
        try {
            const headings = await page.$$('h1, h2, h3, h4, h5, h6');
            const iframes = await page.$$('iframe');
            
            // Extract content sections for debugging
            const contentSections = await page.evaluate(() => {
                const elements = document.querySelectorAll('p, ul, ol, div');
                return Array.from(elements)
                    .slice(0, 20)
                    .map(el => {
                        const text = el.textContent?.trim() || '';
                        const tagName = el.tagName;
                        return `${tagName}: ${text.substring(0, 50)}...`;
                    });
            });

            return {
                totalHeadings: headings.length,
                totalIframes: iframes.length,
                contentSections,
                stoppedAt: "Debug extraction completed"
            };
        } catch (error) {
            return {
                totalHeadings: 0,
                totalIframes: 0,
                contentSections: [],
                stoppedAt: `Debug extraction failed: ${error}`
            };
        }
    }

    /**
     * Extract problem title
     */
    private async extractTitle(page: Page): Promise<string> {
        try {
            const titleSelectors = [
                'h1',
                '[data-cy="question-title"]',
                '.question-title',
                'title'
            ];

            for (const selector of titleSelectors) {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.textContent();
                    if (text && text.trim()) {
                        return text.trim();
                    }
                }
            }

            return "Unknown Problem";
        } catch (error) {
            this.logger.warn(`Error extracting title: ${error}`);
            return "Unknown Problem";
        }
    }

    /**
     * Extract problem ID from URL
     */
    private extractProblemId(url: string): string {
        const match = url.match(/\/problems\/([^\/]+)/);
        return match ? match[1] : 'unknown-problem';
    }
}
