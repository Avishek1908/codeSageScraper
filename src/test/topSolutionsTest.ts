import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { DatasetExporter } from '../exporters/datasetExporter';

async function testTopSolutionsScraping() {
  console.log('🚀 Testing TOP COMMUNITY SOLUTIONS scraping...\n');

  const scraper = new RobustProblemScraper({
    delayBetweenRequests: 3000, // 3 seconds between requests
    timeout: 60000,
    headless: false // Show browser for debugging
  });

  try {
    // Test with just 3 problems to start
    const result = await scraper.scrapeProblemsWithTopSolutions(3);
    
    console.log(`\n📊 Results Summary:`);
    console.log(`✅ Problems scraped: ${result.problems.length}`);
    console.log(`✅ Top solutions found: ${result.solutions.length}`);
    
    // Show details of the top solutions
    result.solutions.forEach((solution, index) => {
      console.log(`\n🏆 Solution ${index + 1}:`);
      console.log(`   Problem: ${solution.title}`);
      console.log(`   Author: ${solution.author}`);
      console.log(`   Votes: ${solution.votes}`);
      console.log(`   Language: ${solution.language}`);
      console.log(`   Code length: ${solution.content.length} characters`);
      console.log(`   Is Community Top: ${solution.isCommunityTop}`);
    });

    // Export the results
    const exporter = new DatasetExporter();
    const dataset = {
      problems: result.problems,
      solutions: result.solutions,
      comments: []
    };

    await exporter.exportDataset(dataset, {
      format: 'json',
      outputDir: './data',
      fileName: 'problems_with_top_solutions',
      includeMetadata: true
    });

    console.log('\n🎉 Top solutions successfully scraped and exported to problems_with_top_solutions.json!');

  } catch (error) {
    console.error('❌ Error during top solutions scraping:', error);
  }
}

// Run the test
testTopSolutionsScraping().catch(console.error);
