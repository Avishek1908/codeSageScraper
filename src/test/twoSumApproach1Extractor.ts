import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { Logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Deep extraction test for Two Sum Editorial - Approach 1 complete content
 * Purpose: Extract ALL content under Approach 1 including description, code, and complexity
 */

async function extractTwoSumApproach1Complete() {
  const logger = new Logger();
  logger.info('🔍 Extracting Complete Two Sum Editorial - Approach 1 Content...');

  const scraper = new RobustProblemScraper();
  
  try {
    // Initialize browser
    await scraper.initialize();
    
    // Navigate directly to Two Sum Editorial
    const editorialUrl = 'https://leetcode.com/problems/two-sum/editorial/';
    logger.info(`🌐 Navigating to: ${editorialUrl}`);
    
    if (!scraper['page']) {
      throw new Error('Page not initialized');
    }

    await scraper['page'].goto(editorialUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for page to load
    await scraper['delay'](5000);

    // Extract complete Approach 1 content
    const approach1Content = await scraper['page'].evaluate(() => {
      const result = {
        found: false,
        heading: '',
        description: '',
        implementation: '',
        codeBlocks: [] as string[],
        complexity: '',
        fullContent: '',
        debugSections: [] as string[]
      };

      // Find Approach 1 heading
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let approach1Heading: Element | null = null;
      
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const headingText = heading.textContent?.toLowerCase() || '';
        
        if (headingText.includes('approach 1') || (headingText.includes('approach') && headingText.includes('brute'))) {
          approach1Heading = heading;
          result.found = true;
          result.heading = heading.textContent?.trim() || '';
          break;
        }
      }

      if (!approach1Heading) return result;

      // Extract all content between Approach 1 and next approach/heading
      let currentElement = approach1Heading.nextElementSibling;
      let contentParts: string[] = [];
      
      while (currentElement) {
        // Stop if we hit another approach or major heading
        if (currentElement.tagName && currentElement.tagName.match(/^H[1-6]$/)) {
          const nextHeadingText = currentElement.textContent?.toLowerCase() || '';
          if (nextHeadingText.includes('approach 2') || 
              nextHeadingText.includes('next') || 
              nextHeadingText.includes('solution')) {
            break;
          }
        }

        const elementText = currentElement.textContent?.trim();
        if (elementText && elementText.length > 5) {
          const elementType = currentElement.tagName || 'UNKNOWN';
          result.debugSections.push(`${elementType}: ${elementText.substring(0, 100)}...`);
          
          // Categorize content
          if (elementText.toLowerCase().includes('implementation')) {
            result.implementation += elementText + '\n\n';
          } else if (elementText.toLowerCase().includes('complexity')) {
            result.complexity += elementText + '\n\n';
          } else if (elementText.length > 20 && !result.description) {
            result.description = elementText;
          }
          
          contentParts.push(elementText);
        }

        // Look for code blocks in this element
        const codeElements = currentElement.querySelectorAll ? 
          currentElement.querySelectorAll('pre, code, [class*="code"], [class*="highlight"]') : [];
        
        for (let i = 0; i < codeElements.length; i++) {
          const codeText = codeElements[i].textContent?.trim();
          if (codeText && codeText.length > 10 && 
              (codeText.includes('def ') || codeText.includes('function') || 
               codeText.includes('class') || codeText.includes('public') ||
               codeText.includes('for') || codeText.includes('return'))) {
            result.codeBlocks.push(codeText);
          }
        }
        
        currentElement = currentElement.nextElementSibling;
      }

      result.fullContent = contentParts.join('\n\n');
      return result;
    });

    // Log and save results
    logger.info(`📊 Two Sum Approach 1 - Complete Extraction Results:`);
    
    if (approach1Content.found) {
      logger.success(`✅ APPROACH 1 COMPLETELY EXTRACTED!`);
      logger.info(`🎯 Heading: "${approach1Content.heading}"`);
      logger.info(`📝 Description Length: ${approach1Content.description.length} chars`);
      logger.info(`🔧 Implementation Length: ${approach1Content.implementation.length} chars`);
      logger.info(`📊 Complexity Length: ${approach1Content.complexity.length} chars`);
      logger.info(`💻 Code Blocks Found: ${approach1Content.codeBlocks.length}`);
      logger.info(`📄 Total Content Length: ${approach1Content.fullContent.length} chars`);

      // Show content preview
      logger.info(`\n📖 CONTENT PREVIEW:`);
      logger.info(`\n🎯 Heading: ${approach1Content.heading}`);
      logger.info(`\n📝 Description:\n${approach1Content.description.substring(0, 300)}...`);
      
      if (approach1Content.implementation) {
        logger.info(`\n🔧 Implementation:\n${approach1Content.implementation.substring(0, 300)}...`);
      }
      
      if (approach1Content.complexity) {
        logger.info(`\n📊 Complexity:\n${approach1Content.complexity.substring(0, 300)}...`);
      }

      if (approach1Content.codeBlocks.length > 0) {
        logger.info(`\n💻 Code Blocks:`);
        approach1Content.codeBlocks.forEach((code, index) => {
          logger.info(`   ${index + 1}. ${code.substring(0, 150)}...`);
        });
      }

      logger.info(`\n🔍 Debug - All Sections Found:`);
      approach1Content.debugSections.forEach((section, index) => {
        logger.info(`   ${index + 1}. ${section}`);
      });

      // Save to file for detailed analysis
      const outputPath = path.join('data', 'two_sum_approach1_content.json');
      await fs.ensureDir('data');
      await fs.writeJson(outputPath, {
        extracted_at: new Date().toISOString(),
        approach1_content: approach1Content,
        source_url: editorialUrl
      }, { spaces: 2 });
      
      logger.success(`💾 Complete content saved to: ${outputPath}`);

    } else {
      logger.warn(`⚠️ APPROACH 1 NOT FOUND`);
    }

  } catch (error) {
    logger.error('❌ Extraction failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Run the extraction
extractTwoSumApproach1Complete().catch(console.error);
