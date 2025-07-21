import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { DatasetExporter } from '../exporters/datasetExporter';

async function testEditorialScraper() {
  console.log('📚 Testing Editorial Scraper - Problems + Official Solutions...');
  
  const scraper = new RobustProblemScraper({
    headless: false,
    timeout: 45000,
    delayBetweenRequests: 5000 // Longer delays for Editorial scraping
  });
  
  const exporter = new DatasetExporter();
  
  try {
    // Test with just 3 problems to start
    const { problems, solutions } = await scraper.scrapeProblemsWithEditorials(3);
    
    console.log(`✅ Successfully processed:`);
    console.log(`   📋 ${problems.length} problems`);
    console.log(`   💡 ${solutions.length} editorial solutions`);
    
    // Show what we got
    problems.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (${p.difficulty})`);
      const relatedSolution = solutions.find(s => s.problemId === p.id);
      if (relatedSolution) {
        console.log(`   ✅ Editorial solution available (${relatedSolution.content.length} chars)`);
      } else {
        console.log(`   ⚠️ No editorial solution found`);
      }
    });
    
    // Export the results with both problems and solutions
    await exporter.exportDataset({
      problems,
      solutions,
      comments: []
    }, {
      format: 'json',
      fileName: 'problems_with_editorials'
    });
    
    // Also create LLM training format
    await exporter.exportForLLMTraining({
      problems,
      solutions,
      comments: []
    }, './data/llm_training_with_editorials');
    
    console.log('📁 Results exported to:');
    console.log('   📄 data/problems_with_editorials.json');
    console.log('   🤖 data/llm_training_with_editorials/');
    
    // Show a sample of what we scraped
    if (solutions.length > 0) {
      console.log('\\n📖 Sample Editorial Solution:');
      const sample = solutions[0];
      console.log(`Problem: ${sample.title}`);
      console.log(`Approach: ${sample.approach.substring(0, 200)}...`);
      console.log(`Code preview: ${sample.content.substring(0, 150)}...`);
      console.log(`Complexity: Time ${sample.complexity.time}, Space ${sample.complexity.space}`);
    }
    
  } catch (error) {
    console.error('❌ Editorial test failed:', error);
  }
}

if (require.main === module) {
  testEditorialScraper();
}
