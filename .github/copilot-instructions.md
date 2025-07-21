<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CodeSage-Scrape Project Instructions

This is a TypeScript project for scraping LeetCode problems, solutions, and comments to build a dataset for LLM training using Playwright.

## Project Structure
- `src/scrapers/` - Web scrapers for different data types (problems, solutions, comments)
- `src/exporters/` - Data export utilities for various formats (JSON, CSV, JSONL)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility classes (Logger, BaseScraper)
- `data/` - Output directory for scraped data

## Key Technologies
- **Playwright** - For web scraping with browser automation
- **TypeScript** - For type safety and better development experience
- **csv-writer** - For CSV export functionality
- **fs-extra** - For enhanced file system operations

## Coding Guidelines
- Always use TypeScript types from `src/types/index.ts`
- Extend `BaseScraper` for any new scraper implementations
- Use the `Logger` utility for consistent logging
- Implement proper error handling and retry logic
- Add delays between requests to be respectful to LeetCode's servers
- Use the `DatasetExporter` for standardized data export

## Web Scraping Best Practices
- Always check for element existence before interacting
- Use proper selectors that are stable across page updates
- Implement retry logic for network failures
- Add randomized delays to appear more human-like
- Respect robots.txt and rate limiting
- Handle dynamic content loading with proper waits

## Data Processing
- Clean and validate scraped data before export
- Maintain consistent data structures across different scrapers
- Include metadata like scraping timestamps
- Export data in multiple formats for different use cases
- Provide LLM-ready training data format

## Error Handling
- Log all errors with context information
- Continue processing other items when individual items fail
- Implement circuit breaker patterns for repeated failures
- Provide detailed error messages for debugging

When suggesting code improvements or new features, consider:
1. Performance and efficiency of web scraping
2. Data quality and consistency
3. Compliance with website terms of service
4. Scalability for large datasets
5. Usefulness for LLM training applications
