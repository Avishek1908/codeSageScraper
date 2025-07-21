# CodeSage-Scrape 🚀

A powerful TypeScript-based web scraper for collecting LeetCode problems, solutions, and comments to build comprehensive datasets for LLM training.

## ✨ Features

- **Comprehensive Data Collection**: Scrape problems, solutions, and community discussions
- **Multiple Export Formats**: JSON, CSV, and JSONL for different use cases
- **LLM-Ready Datasets**: Pre-formatted training data for language models
- **Respectful Scraping**: Built-in rate limiting and retry mechanisms
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Modular Architecture**: Easy to extend with new scrapers and exporters

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development
- **Playwright** - Robust web scraping with browser automation
- **Node.js** - Runtime environment
- **csv-writer** - CSV export functionality
- **fs-extra** - Enhanced file system operations

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CodeSage-Scrape
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```

## 🚀 Quick Start

### Basic Usage

```bash
# Build the project
npm run build

# Run the complete scraping pipeline
npm run dev

# Or run specific scrapers
npm run scrape:problems
npm run scrape:solutions
npm run scrape:comments
```

### Programmatic Usage

```typescript
import { ProblemScraper, SolutionScraper, CommentScraper, DatasetExporter } from './src';

async function collectData() {
  const problemScraper = new ProblemScraper();
  const solutionScraper = new SolutionScraper();
  const commentScraper = new CommentScraper();
  const exporter = new DatasetExporter();

  // Scrape data
  const problems = await problemScraper.scrapeProblems(50);
  const solutions = await solutionScraper.scrapeSolutions(problems);
  const comments = await commentScraper.scrapeComments(problems);

  // Export dataset
  await exporter.exportDataset({ problems, solutions, comments });
}
```

## 📚 Project Structure

```
CodeSage-Scrape/
├── src/
│   ├── scrapers/           # Web scrapers
│   │   ├── problemScraper.ts
│   │   ├── solutionScraper.ts
│   │   └── commentScraper.ts
│   ├── exporters/          # Data exporters
│   │   └── datasetExporter.ts
│   ├── utils/              # Utility classes
│   │   ├── baseScraper.ts
│   │   └── logger.ts
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   └── index.ts            # Main entry point
├── data/                   # Output directory
├── .env                    # Environment variables
└── README.md
```

## 🔧 Configuration

Customize scraping behavior through environment variables:

```env
# Scraping Settings
MAX_CONCURRENCY=3
DELAY_BETWEEN_REQUESTS=1000
TIMEOUT=30000
RETRIES=3
HEADLESS=true

# Output Settings
OUTPUT_DIR=./data
EXPORT_FORMAT=json
INCLUDE_METADATA=true

# Data Collection Limits
MAX_PROBLEMS=100
MAX_SOLUTIONS_PER_PROBLEM=5
MAX_COMMENTS_PER_PROBLEM=20
```

## 📊 Data Formats

### Problems
- Problem statements and descriptions
- Difficulty levels and tags
- Examples and constraints
- Acceptance rates and metadata

### Solutions
- Code implementations in multiple languages
- Performance metrics (runtime, memory)
- Community votes and ratings
- Detailed explanations and approaches

### Comments
- Community discussions and insights
- Threaded conversations
- Vote counts and timestamps
- Author information

## 🤖 LLM Training Data

The exporter generates training-ready datasets:

```typescript
// Export LLM training format
await exporter.exportForLLMTraining(dataset, './llm_training');
```

Output format:
```json
{
  "instruction": "Solve the following LeetCode problem...",
  "input": "Input: [1,2,3]\\nOutput: [3,2,1]",
  "output": "Language: Python\\n\\nSolution:\\ndef reverse(arr)...",
  "metadata": {
    "problem_id": "reverse-array",
    "difficulty": "Easy",
    "tags": ["array", "two-pointers"]
  }
}
```

## 📝 Available Scripts

```bash
npm run build          # Compile TypeScript
npm run start          # Run compiled JavaScript
npm run dev            # Run with ts-node
npm run dev:watch      # Run with auto-reload
npm run scrape:problems    # Scrape problems only
npm run scrape:solutions   # Scrape solutions only
npm run scrape:comments    # Scrape comments only
npm run export:dataset     # Export existing data
npm run clean          # Clean build directory
```

## ⚖️ Legal and Ethical Considerations

- **Respect Rate Limits**: Built-in delays and concurrency limits
- **Terms of Service**: Review LeetCode's ToS before large-scale scraping
- **Educational Use**: Intended for research and educational purposes
- **Data Privacy**: Be mindful of user-generated content

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Playwright Installation Issues:**
```bash
# Reinstall browsers
npx playwright install --force
```

**Rate Limiting:**
- Increase `DELAY_BETWEEN_REQUESTS` in `.env`
- Reduce `MAX_CONCURRENCY`

**TypeScript Errors:**
```bash
# Clean and rebuild
npm run clean
npm run build
```

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- LeetCode for providing an excellent platform for coding practice
- Playwright team for the robust web automation framework
- The open-source community for inspiration and tools

---

**Built with ❤️ for the developer community**

Happy scraping! 🎯
