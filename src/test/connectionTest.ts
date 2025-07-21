import { ProblemScraper } from '../scrapers/problemScraper';

async function testConnection() {
  const scraper = new ProblemScraper({
    headless: false,
    timeout: 60000,
    delayBetweenRequests: 3000
  });
  
  try {
    console.log('🧪 Testing LeetCode connection...');
    
    // Test with just 3 problems
    const problems = await scraper.scrapeProblems(3);
    
    console.log(`✅ Successfully scraped ${problems.length} problems:`);
    problems.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (${p.difficulty}) - ${p.slug}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Additional debugging
    console.log('\n🔍 Debugging tips:');
    console.log('1. Check if LeetCode is accessible in your browser');
    console.log('2. Try running with headless=false to see what\'s happening');
    console.log('3. LeetCode might have rate limiting or bot detection');
    console.log('4. Try running: npm run cli quick');
  }
}

if (require.main === module) {
  testConnection();
}
