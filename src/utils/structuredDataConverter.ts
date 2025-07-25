import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * StructuredDataConverter - Converts existing scraped data to the structured format
 * This can be used to transform data from other scrapers into the clean format like complete_two_sum_editorial.json
 */
export class StructuredDataConverter {
    private logger: Logger;

    constructor() {
        this.logger = new Logger();
    }

    /**
     * Convert raw scraped data to structured editorial format
     */
    async convertToStructuredFormat(inputData: any, problemTitle: string): Promise<any> {
        this.logger.info('🔄 Converting data to structured format...');

        try {
            // Handle integrated format with solutions array
            let actualData = inputData;
            if (inputData.solutions && Array.isArray(inputData.solutions) && inputData.solutions[0]) {
                actualData = inputData.solutions[0];
            }
            
            // Extract problem ID from title or content
            const problemId = this.extractProblemId(problemTitle);
            
            // Build structured solution object
            const structuredSolution = {
                problemId,
                title: `Complete Editorial Solution: ${problemTitle}`,
                extractedAt: new Date().toISOString(),
                sourceUrl: actualData.sourceUrl || `https://leetcode.com/problems/${problemId}/editorial/`,
                videoSolution: this.extractVideoSolution(actualData),
                approaches: this.extractApproaches(actualData),
                iframeImplementations: this.extractIframeImplementations(actualData),
                topComments: this.extractTopComments(actualData),
                summary: {},
                debugInfo: this.extractDebugInfo(actualData)
            };

            // Calculate summary
            structuredSolution.summary = this.createSummary(structuredSolution);

            return {
                question: problemTitle,
                solution: structuredSolution
            };

        } catch (error) {
            this.logger.error(`Error converting data: ${error}`);
            throw error;
        }
    }

    /**
     * Extract video solution from input data
     */
    private extractVideoSolution(inputData: any): any {
        if (inputData.videoSolution) {
            return inputData.videoSolution;
        }

        // Look for video indicators in content
        const content = JSON.stringify(inputData);
        const hasVideo = content.includes('video') || content.includes('vimeo') || content.includes('youtube');

        return {
            found: hasVideo,
            description: hasVideo ? "Video Solution" : "",
            iframeUrl: ""
        };
    }

    /**
     * Extract approaches from input data
     */
    private extractApproaches(inputData: any): any[] {
        const approaches = [];

        // If data already has approaches
        if (inputData.approaches && Array.isArray(inputData.approaches)) {
            return inputData.approaches;
        }

        // Try to extract from content
        if (inputData.content || inputData.solutions) {
            let content = inputData.content || inputData.solutions;
            
            // Handle case where content is an object or array
            if (typeof content !== 'string') {
                content = JSON.stringify(content);
            }
            
            // Look for approach patterns
            const approachPattern = /Approach\s+\d+[:\-\s]*/gi;
            const matches = content.match(approachPattern);
            
            if (matches) {
                matches.forEach((match: string, index: number) => {
                    approaches.push({
                        title: `Approach ${index + 1}`,
                        algorithm: "Algorithm",
                        implementation: "Implementation",
                        complexityAnalysis: "Complexity Analysis",
                        codeBlocks: [],
                        iframeUrl: "",
                        fullContent: this.extractApproachContent(content, index)
                    });
                });
            }
        }

        // If no approaches found, create a default one
        if (approaches.length === 0) {
            approaches.push({
                title: "Approach 1: Solution",
                algorithm: "Algorithm",
                implementation: "Implementation",
                complexityAnalysis: "Complexity Analysis",
                codeBlocks: [],
                iframeUrl: "",
                fullContent: inputData.content || "Editorial content"
            });
        }

        return approaches;
    }

    /**
     * Extract iframe implementations from input data
     */
    private extractIframeImplementations(inputData: any): any[] {
        const implementations: any[] = [];

        // If data already has iframe implementations
        if (inputData.iframeImplementations && Array.isArray(inputData.iframeImplementations)) {
            return inputData.iframeImplementations;
        }

        // Look for code blocks or solutions
        if (inputData.solutions || inputData.codeBlocks) {
            const codes = inputData.solutions || inputData.codeBlocks;
            
            if (Array.isArray(codes)) {
                codes.forEach((code, index) => {
                    implementations.push({
                        src: `https://leetcode.com/playground/example${index + 1}/shared`,
                        id: `iframe-${index + 1}`,
                        content: typeof code === 'string' ? code : code.content || ''
                    });
                });
            }
        }

        return implementations;
    }

    /**
     * Extract top comments from input data
     */
    private extractTopComments(inputData: any): { [key: string]: string } {
        const comments: { [key: string]: string } = {};

        // If data has structured comments
        if (inputData.topComments) {
            return inputData.topComments;
        }

        // If data has comments array
        if (inputData.comments && Array.isArray(inputData.comments)) {
            inputData.comments.slice(0, 5).forEach((comment: any, index: number) => {
                comments[`comment${index + 1}`] = this.cleanCommentText(
                    typeof comment === 'string' ? comment : comment.content || comment.text || ''
                );
            });
        }

        // If data has enhanced comments (our previous format)
        if (inputData.comment1 || inputData.comment2) {
            for (let i = 1; i <= 10; i++) {
                const commentKey = `comment${i}`;
                if (inputData[commentKey]) {
                    comments[commentKey] = this.cleanCommentText(inputData[commentKey]);
                }
            }
        }

        return comments;
    }

    /**
     * Extract debug information
     */
    private extractDebugInfo(inputData: any): any {
        return {
            totalHeadings: inputData.debugInfo?.totalHeadings || 0,
            totalIframes: inputData.debugInfo?.totalIframes || 0,
            contentSections: inputData.debugInfo?.contentSections || [],
            stoppedAt: inputData.debugInfo?.stoppedAt || "Conversion completed",
            originalFormat: "converted_from_scraped_data"
        };
    }

    /**
     * Create summary statistics
     */
    private createSummary(solution: any): any {
        return {
            totalApproaches: solution.approaches?.length || 0,
            totalImplementations: solution.iframeImplementations?.length || 0,
            hasVideoSolution: solution.videoSolution?.found || false,
            contentLength: this.calculateContentLength(solution),
            totalComments: Object.keys(solution.topComments || {}).length
        };
    }

    /**
     * Calculate total content length
     */
    private calculateContentLength(solution: any): number {
        let length = 0;
        
        // Add approaches content
        if (solution.approaches) {
            solution.approaches.forEach((approach: any) => {
                length += approach.fullContent?.length || 0;
            });
        }

        // Add implementation content
        if (solution.iframeImplementations) {
            solution.iframeImplementations.forEach((impl: any) => {
                length += impl.content?.length || 0;
            });
        }

        return length;
    }

    /**
     * Extract approach content from text
     */
    private extractApproachContent(content: string, index: number): string {
        // Simple extraction - in real implementation, this would be more sophisticated
        const sections = content.split(/Approach\s+\d+/gi);
        return sections[index + 1]?.substring(0, 500) || content.substring(0, 500);
    }

    /**
     * Clean comment text
     */
    private cleanCommentText(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .replace(/Read more\d*/g, '')
            .replace(/Show \d+ Replies?Reply/g, '')
            .replace(/\d+\s*(upvotes?|likes?|votes?)/gi, '')
            .trim();
    }

    /**
     * Extract problem ID from title
     */
    private extractProblemId(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    /**
     * Convert a file from existing format to structured format
     */
    async convertFile(inputPath: string, outputPath: string): Promise<void> {
        try {
            this.logger.info(`📁 Converting file: ${inputPath}`);

            // Read input data
            const inputData = await fs.readJSON(inputPath);
            
            // Extract problem title
            const problemTitle = this.extractTitleFromData(inputData);

            // Convert to structured format
            const structuredData = await this.convertToStructuredFormat(inputData, problemTitle);

            // Write output
            await fs.writeJSON(outputPath, structuredData, { spaces: 2 });

            this.logger.info(`✅ Converted file saved: ${outputPath}`);

        } catch (error) {
            this.logger.error(`Error converting file: ${error}`);
            throw error;
        }
    }

    /**
     * Extract title from input data
     */
    private extractTitleFromData(data: any): string {
        // Try various places where title might be stored
        if (data.title) return data.title;
        if (data.question) return data.question;
        if (data.problemTitle) return data.problemTitle;
        if (data.name) return data.name;
        
        // Check if data has problems array (integrated format)
        if (data.problems && Array.isArray(data.problems) && data.problems[0]) {
            return data.problems[0].title || 'Unknown Problem';
        }
        
        // Check if data has solutions array
        if (data.solutions && Array.isArray(data.solutions) && data.solutions[0]) {
            return data.solutions[0].problemId?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Problem';
        }
        
        return 'Unknown Problem';
    }
}

export default StructuredDataConverter;
