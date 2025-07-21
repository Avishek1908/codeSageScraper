import { ProblemScraper } from '../scrapers/problemScraper';
import { DatasetExporter } from '../exporters/datasetExporter';

async function scrapeProblemsOnly() {
  const scraper = new ProblemScraper();
  const exporter = new DatasetExporter();
  
  try {
    console.log('🚀 Starting Problems-Only Scraping...');
    
    const problems = await scraper.scrapeProblems(25);
    
    await exporter.exportDataset({
      problems,
      solutions: [],
      comments: []
    }, {
      format: 'json',
      fileName: 'problems_only'
    });
    
    console.log('✅ Problems scraping completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  scrapeProblemsOnly();
}
