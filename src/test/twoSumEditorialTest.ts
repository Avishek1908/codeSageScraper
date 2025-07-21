import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { Logger } from '../utils/logger';

/**
 * Dedicated test for Two Sum Editorial - Approach 1 content extraction
 * Purpose: Verify we can properly target and extract Approach 1 section content
 */

async function testTwoSumApproach1() {
  const logger = new Logger();
  logger.info('🔍 Testing Two Sum Editorial - Approach 1 Content Extraction...');

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

    // Extract Approach 1 content specifically
    const approach1Data = await scraper['page'].evaluate(() => {
      const results = {
        foundApproach1: false,
        approach1Text: '',
        approach1Elements: [] as string[],
        allHeadings: [] as string[],
        debugInfo: {
          totalHeadings: 0,
          pageTitle: document.title,
          url: window.location.href
        }
      };

      // First, collect all headings for debugging
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      results.debugInfo.totalHeadings = allHeadings.length;
      
      for (let i = 0; i < allHeadings.length; i++) {
        const heading = allHeadings[i];
        const headingText = heading.textContent?.trim() || '';
        results.allHeadings.push(`${heading.tagName}: "${headingText}"`);
      }

      // Look specifically for "Approach 1" heading
      for (let i = 0; i < allHeadings.length; i++) {
        const heading = allHeadings[i];
        const headingText = heading.textContent?.toLowerCase() || '';
        
        if (headingText.includes('approach 1') || headingText.includes('approach') && headingText.includes('1')) {
          results.foundApproach1 = true;
          results.approach1Text = heading.textContent?.trim() || '';
          
          // Extract content after this heading until next heading
          let nextElement = heading.nextElementSibling;
          let contentDepth = 0;
          
          while (nextElement && contentDepth < 15) {
            // Stop if we hit another heading
            if (nextElement.tagName && nextElement.tagName.match(/^H[1-6]$/)) {
              break;
            }
            
            const elementText = nextElement.textContent?.trim();
            if (elementText && elementText.length > 10) {
              results.approach1Elements.push(`${nextElement.tagName}: ${elementText.substring(0, 200)}...`);
            }
            
            nextElement = nextElement.nextElementSibling;
            contentDepth++;
          }
          
          break; // Found Approach 1, stop looking
        }
      }

      return results;
    });

    // Log results
    logger.info(`📊 Two Sum Editorial Analysis Results:`);
    logger.info(`✅ Page Title: ${approach1Data.debugInfo.pageTitle}`);
    logger.info(`✅ URL: ${approach1Data.debugInfo.url}`);
    logger.info(`✅ Total Headings Found: ${approach1Data.debugInfo.totalHeadings}`);
    
    logger.info(`\n📋 All Headings on Page:`);
    approach1Data.allHeadings.forEach((heading, index) => {
      logger.info(`   ${index + 1}. ${heading}`);
    });

    if (approach1Data.foundApproach1) {
      logger.success(`\n✅ APPROACH 1 FOUND!`);
      logger.info(`🎯 Approach 1 Heading: "${approach1Data.approach1Text}"`);
      logger.info(`📝 Content Elements Found: ${approach1Data.approach1Elements.length}`);
      
      logger.info(`\n📄 Approach 1 Content Preview:`);
      approach1Data.approach1Elements.forEach((element, index) => {
        logger.info(`   ${index + 1}. ${element}`);
      });
    } else {
      logger.warn(`\n⚠️ APPROACH 1 NOT FOUND`);
      logger.info(`💡 This might indicate the page structure has changed or content is dynamically loaded`);
    }

  } catch (error) {
    logger.error('❌ Test failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Run the test
testTwoSumApproach1().catch(console.error);
