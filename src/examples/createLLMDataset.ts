import { ProblemScraper } from '../scrapers/problemScraper';
import { SolutionScraper } from '../scrapers/solutionScraper';
import { DatasetExporter } from '../exporters/datasetExporter';

async function createLLMDataset() {
  const problemScraper = new ProblemScraper();
  const solutionScraper = new SolutionScraper();
  const exporter = new DatasetExporter();
  
  try {
    console.log('🤖 Creating LLM Training Dataset...');
    
    // Scrape a smaller set for quick testing
    const problems = await problemScraper.scrapeProblems(5);
    const solutions = await solutionScraper.scrapeSolutions(problems, 2); // 2 solutions per problem
    
    const dataset = {
      problems,
      solutions,
      comments: [] // Skip comments for this example
    };
    
    // Export in multiple formats
    await exporter.exportDataset(dataset, { format: 'json' });
    await exporter.exportDataset(dataset, { format: 'jsonl' });
    
    // Create LLM-specific training data
    await exporter.exportForLLMTraining(dataset);
    
    console.log('🎯 LLM dataset ready for training!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  createLLMDataset();
}
