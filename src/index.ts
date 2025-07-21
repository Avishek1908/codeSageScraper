import dotenv from 'dotenv';
import { ProblemScraper } from './scrapers/problemScraper';
import { SolutionScraper } from './scrapers/solutionScraper';
import { CommentScraper } from './scrapers/commentScraper';
import { DatasetExporter } from './exporters/datasetExporter';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  const logger = new Logger();
  
  try {
    logger.info('🚀 Starting CodeSage-Scrape for LeetCode data collection');
    
    // Initialize scrapers
    const problemScraper = new ProblemScraper();
    const solutionScraper = new SolutionScraper();
    const commentScraper = new CommentScraper();
    const datasetExporter = new DatasetExporter();
    
    // Example workflow - you can customize this based on your needs
    logger.info('📋 Step 1: Scraping problem list...');
    const problems = await problemScraper.scrapeProblems(10); // Scrape top 10 problems for demo
    
    logger.info('💡 Step 2: Scraping solutions...');
    const solutions = await solutionScraper.scrapeSolutions(problems);
    
    logger.info('💬 Step 3: Scraping comments...');
    const comments = await commentScraper.scrapeComments(problems);
    
    logger.info('📊 Step 4: Exporting dataset...');
    await datasetExporter.exportDataset({
      problems,
      solutions,
      comments
    });
    
    logger.success('✅ Data collection completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

export { main };
