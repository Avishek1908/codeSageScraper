import { chromium } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';
import { StructuredEditorialScraper } from '../scrapers/structuredEditorialScraper';
import { DatasetExporter } from '../exporters/datasetExporter';
import { Logger } from '../utils/logger';

/**
 * Test script for the StructuredEditorialScraper
 * This demonstrates how to extract editorial content in the same format as complete_two_sum_editorial.json
 */
async function testStructuredEditorialScraper() {
    const logger = new Logger();
    const scraper = new StructuredEditorialScraper();
    const exporter = new DatasetExporter();

    try {
        logger.info('🚀 Starting Structured Editorial Scraper Test');

        // Initialize the scraper
        await scraper.initialize();
        
        // Get the page from the scraper
        if (!scraper['page']) {
            throw new Error('Failed to initialize page');
        }
        const page = scraper['page'];

        // Test URL - Two Sum Editorial
        const testUrl = 'https://leetcode.com/problems/two-sum/editorial/';
        
        logger.info(`📖 Scraping editorial from: ${testUrl}`);

        // Scrape the editorial using the new structured format
        const editorialSolution = await scraper.scrapeStructuredEditorial(page, testUrl);

        // Create the final output in the same format as complete_two_sum_editorial.json
        const output = {
            question: editorialSolution.problemId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            solution: editorialSolution
        };

        // Export the result using fs-extra directly
        const outputPath = path.join('data', 'structured_two_sum_editorial.json');
        await fs.writeJSON(outputPath, output, { spaces: 2 });

        logger.info(`✅ Successfully exported structured editorial to: ${outputPath}`);
        
        // Display summary
        console.log('\n📊 Extraction Summary:');
        console.log(`   - Problem: ${editorialSolution.title}`);
        console.log(`   - Approaches: ${editorialSolution.summary.totalApproaches}`);
        console.log(`   - Code Implementations: ${editorialSolution.summary.totalImplementations}`);
        console.log(`   - Comments: ${editorialSolution.summary.totalComments}`);
        console.log(`   - Video Solution: ${editorialSolution.summary.hasVideoSolution ? 'Yes' : 'No'}`);
        console.log(`   - Source URL: ${editorialSolution.sourceUrl}`);

        await scraper.cleanup();

    } catch (error) {
        logger.error(`❌ Test failed: ${error}`);
        await scraper.cleanup();
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testStructuredEditorialScraper()
        .then(() => {
            console.log('\n🎉 Structured Editorial Scraper test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

export { testStructuredEditorialScraper };
