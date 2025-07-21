import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { DatasetExporter } from '../exporters/datasetExporter';

async function testRobustScraper() {
  console.log('🛡️ Testing Robust Scraper with fallback mechanisms...');
  
  const scraper = new RobustProblemScraper({
    headless: false,
    timeout: 30000,
    delayBetweenRequests: 4000
  });
  
  const exporter = new DatasetExporter();
  
  try {
    // Test with just 5 problems
    const problems = await scraper.scrapeProblems(5);
    
    console.log(`✅ Successfully processed ${problems.length} problems:`);
    problems.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (${p.difficulty})`);
    });
    
    // Export the results
    await exporter.exportDataset({
      problems,
      solutions: [],
      comments: []
    }, {
      format: 'json',
      fileName: 'robust_scrape_test'
    });
    
    console.log('📁 Results exported to data/robust_scrape_test.json');
    
  } catch (error) {
    console.error('❌ Robust test failed:', error);
  }
}

if (require.main === module) {
  testRobustScraper();
}
