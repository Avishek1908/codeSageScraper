import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { DatasetExporter } from '../exporters/datasetExporter';
import { Logger } from '../utils/logger';

/**
 * Test the integrated enhanced comment extraction in the main scraper
 * This should produce a complete editorial structure with enhanced comments
 */

async function testIntegratedEditorialWithComments() {
  const logger = new Logger();
  logger.info('🔍 Testing Integrated Editorial with Enhanced Comments...');

  const scraper = new RobustProblemScraper({
    headless: false,
    timeout: 45000,
    delayBetweenRequests: 5000
  });
  
  try {
    // Test with just one problem (Two Sum) to verify the integration
    const { problems, solutions } = await scraper.scrapeProblemsWithEditorials(1);
    
    logger.info(`✅ Successfully processed:`);
    logger.info(`   📋 ${problems.length} problems`);
    logger.info(`   💡 ${solutions.length} editorial solutions`);
    
    if (solutions.length > 0) {
      const solution = solutions[0];
      logger.info(`\n📖 Enhanced Editorial Solution:`)
      logger.info(`   Title: ${solution.title}`);
      logger.info(`   Content length: ${solution.content?.length || 0} characters`);
      logger.info(`   Has topComments: ${solution.topComments ? 'Yes' : 'No'}`);
      
      if (solution.topComments) {
        const commentKeys = Object.keys(solution.topComments);
        logger.info(`   Total comment keys: ${commentKeys.length}`);
        logger.info(`   Comment keys: ${commentKeys.slice(0, 5).join(', ')}${commentKeys.length > 5 ? '...' : ''}`);
        
        // Show first comment as sample
        if (commentKeys.length > 0) {
          const firstComment = solution.topComments[commentKeys[0]];
          logger.info(`\n💬 Sample Comment:`)
          logger.info(`   ${firstComment.substring(0, 200)}${firstComment.length > 200 ? '...' : ''}`);
        }
      }
      
      if (solution.summary) {
        logger.info(`\n📊 Summary:`)
        logger.info(`   Implementations: ${solution.summary.totalImplementations}`);
        logger.info(`   Comments: ${solution.summary.totalComments}`);
        logger.info(`   Enhanced Comments: ${solution.summary.hasEnhancedComments}`);
      }
    }
    
    // Export the results with enhanced structure
    const exporter = new DatasetExporter();
    await exporter.exportDataset({
      problems,
      solutions,
      comments: []
    }, {
      format: 'json',
      fileName: 'integrated_editorial_with_enhanced_comments'
    });
    
    logger.success(`\n🎉 Integration test completed!`);
    logger.info(`📁 Results exported to: data/integrated_editorial_with_enhanced_comments.json`);
    
  } catch (error) {
    logger.error('❌ Integration test failed:', error);
  }
}

// Run the integration test
testIntegratedEditorialWithComments().catch(console.error);
