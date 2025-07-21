#!/usr/bin/env node

/**
 * CodeSage-Scrape CLI Launcher
 * Quick start script for common scraping tasks
 */

import { ProblemScraper } from './scrapers/problemScraper';
import { RobustProblemScraper } from './scrapers/robustProblemScraper';
import { DatasetExporter } from './exporters/datasetExporter';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function runCommand() {
  switch (command) {
    case 'quick':
      await quickScrape();
      break;
    case 'problems':
      await scrapeProblemsOnly();
      break;
    case 'editorials':
      await scrapeWithEditorials();
      break;
    case 'top-solutions':
      await scrapeWithTopSolutions();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function quickScrape() {
  console.log('🚀 Quick Scrape: 5 problems with basic data');
  const scraper = new ProblemScraper();
  const exporter = new DatasetExporter();
  
  const problems = await scraper.scrapeProblems(5);
  await exporter.exportDataset({ problems, solutions: [], comments: [] });
  
  console.log('✅ Quick scrape completed!');
}

async function scrapeProblemsOnly() {
  console.log('📋 Scraping problems only...');
  const scraper = new ProblemScraper();
  const exporter = new DatasetExporter();
  
  const problems = await scraper.scrapeProblems(20);
  await exporter.exportDataset({ problems, solutions: [], comments: [] });
  
  console.log('✅ Problems scraping completed!');
}

async function scrapeWithEditorials() {
  console.log('📚 Scraping problems WITH Editorial solutions...');
  const scraper = new RobustProblemScraper();
  const exporter = new DatasetExporter();
  
  const { problems, solutions } = await scraper.scrapeProblemsWithEditorials(5);
  await exporter.exportDataset({ problems, solutions, comments: [] });
  
  console.log(`✅ Editorial scraping completed! ${problems.length} problems, ${solutions.length} solutions`);
}

async function scrapeWithTopSolutions() {
  console.log('🏆 Scraping problems with TOP COMMUNITY solutions...');
  const scraper = new RobustProblemScraper({ 
    headless: false,
    delayBetweenRequests: 4000 // Longer delays for community solutions
  });
  const exporter = new DatasetExporter();
  
  const { problems, solutions } = await scraper.scrapeProblemsWithTopSolutions(5);
  await exporter.exportDataset({ problems, solutions, comments: [] });
  
  console.log(`✅ Top community solutions scraping completed! ${problems.length} problems, ${solutions.length} solutions`);
}

function showHelp() {
  console.log(`
CodeSage-Scrape CLI

Usage: npm run cli [command]

Commands:
  quick          - Quick scrape of 5 problems
  problems       - Scrape 20 problems only
  editorials     - Scrape 5 problems WITH Editorial solutions
  top-solutions  - 🆕 Scrape 5 problems WITH TOP COMMUNITY solutions (highest voted)
  help           - Show this help message

Examples:
  npm run cli quick
  npm run cli problems
  npm run cli editorials       - 🆕 Get official Editorial solutions!
  npm run cli top-solutions    - 🆕 Get highest voted community solutions!
  npm run dev                 - Run full scraping pipeline
  npm run build               - Build the project
  
Test Commands:
  npm run test:editorial      - Test Editorial scraping
  npm run test:top-solutions  - Test top community solutions scraping
  npm run test:robust         - Test robust problem scraping
  npm run test:quick          - Test with sample data
  `);
}

runCommand().catch(console.error);
