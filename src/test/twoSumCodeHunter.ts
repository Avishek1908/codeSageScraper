import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { Logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Deep code hunting test for Two Sum Editorial - Approach 1 Implementation section
 * Purpose: Find the actual code implementation under Approach 1
 */

async function huntTwoSumApproach1Code() {
  const logger = new Logger();
  logger.info('🕵️ Hunting for Two Sum Approach 1 Implementation Code...');

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
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait longer for dynamic content
    await scraper['delay'](8000);

    // Hunt for code in multiple ways
    const codeHuntResults = await scraper['page'].evaluate(() => {
      const results = {
        iframes: [] as any[],
        allCodeElements: [] as string[],
        implementationSectionCode: [] as string[],
        allInteractiveElements: [] as string[],
        allScriptContent: [] as string[],
        debugInfo: {
          totalIframes: 0,
          totalCodeElements: 0,
          totalInteractiveElements: 0
        }
      };

      // 1. Hunt for iframes
      const iframes = document.querySelectorAll('iframe');
      results.debugInfo.totalIframes = iframes.length;
      
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i] as HTMLIFrameElement;
        results.iframes.push({
          src: iframe.src || 'no-src',
          id: iframe.id || 'no-id',
          className: iframe.className || 'no-class',
          title: iframe.title || 'no-title'
        });

        // Try to access iframe content
        try {
          if (iframe.contentDocument) {
            const iframeDoc = iframe.contentDocument;
            const iframeText = iframeDoc.body?.textContent || '';
            if (iframeText.includes('def ') || iframeText.includes('function') || 
                iframeText.includes('class') || iframeText.includes('public')) {
              results.implementationSectionCode.push(`IFRAME-${i}: ${iframeText.substring(0, 500)}`);
            }
          }
        } catch (e) {
          // Cross-origin or access denied
        }
      }

      // 2. Hunt for ALL code elements on the page
      const allCodeSelectors = [
        'pre', 'code', '[class*="code"]', '[class*="highlight"]', 
        '[class*="lang-"]', '[class*="language-"]', '[data-lang]',
        '.highlight', '.code-block', '.syntax-highlight'
      ];
      
      allCodeSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const text = element.textContent?.trim();
          if (text && text.length > 20) {
            results.allCodeElements.push(`${selector}: ${text.substring(0, 200)}`);
          }
        }
      });

      results.debugInfo.totalCodeElements = results.allCodeElements.length;

      // 3. Look specifically around Implementation sections
      const allElements = document.querySelectorAll('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const text = element.textContent?.toLowerCase() || '';
        
        if (text.includes('implementation')) {
          // Look at siblings and children for code
          const siblings = element.parentElement?.children || [];
          for (let j = 0; j < siblings.length; j++) {
            const sibling = siblings[j];
            const siblingText = sibling.textContent?.trim();
            if (siblingText && (siblingText.includes('def ') || siblingText.includes('function') ||
                              siblingText.includes('class') || siblingText.includes('public') ||
                              siblingText.includes('for') || siblingText.includes('return'))) {
              results.implementationSectionCode.push(`SIBLING: ${siblingText.substring(0, 300)}`);
            }
          }

          // Look at children
          const children = element.children;
          for (let k = 0; k < children.length; k++) {
            const child = children[k];
            const childText = child.textContent?.trim();
            if (childText && (childText.includes('def ') || childText.includes('function') ||
                             childText.includes('class') || childText.includes('public'))) {
              results.implementationSectionCode.push(`CHILD: ${childText.substring(0, 300)}`);
            }
          }
        }
      }

      // 4. Hunt for interactive elements (tabs, buttons, etc.)
      const interactiveSelectors = [
        'button', '[role="tab"]', '[data-toggle]', '[class*="tab"]',
        '[class*="toggle"]', '[class*="expand"]', '[class*="collapse"]'
      ];
      
      interactiveSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const text = element.textContent?.trim() || '';
          const className = element.className || '';
          if (text.length > 0) {
            results.allInteractiveElements.push(`${selector}: "${text}" class="${className}"`);
          }
        }
      });

      results.debugInfo.totalInteractiveElements = results.allInteractiveElements.length;

      // 5. Look for script content that might contain code
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const scriptText = script.textContent || '';
        if (scriptText.includes('twoSum') || scriptText.includes('Two Sum') ||
            scriptText.includes('Approach 1')) {
          results.allScriptContent.push(`SCRIPT-${i}: ${scriptText.substring(0, 300)}`);
        }
      }

      return results;
    });

    // Report findings
    logger.info(`📊 Code Hunt Results:`);
    logger.info(`🖼️ Iframes Found: ${codeHuntResults.debugInfo.totalIframes}`);
    logger.info(`💻 Code Elements Found: ${codeHuntResults.debugInfo.totalCodeElements}`);
    logger.info(`🎛️ Interactive Elements Found: ${codeHuntResults.debugInfo.totalInteractiveElements}`);
    logger.info(`📝 Implementation Code Found: ${codeHuntResults.implementationSectionCode.length}`);
    
    if (codeHuntResults.iframes.length > 0) {
      logger.info(`\n🖼️ IFRAMES DETECTED:`);
      codeHuntResults.iframes.forEach((iframe, index) => {
        logger.info(`   ${index + 1}. src: "${iframe.src}", id: "${iframe.id}", class: "${iframe.className}"`);
      });
    }

    if (codeHuntResults.allCodeElements.length > 0) {
      logger.info(`\n💻 ALL CODE ELEMENTS:`);
      codeHuntResults.allCodeElements.slice(0, 10).forEach((code, index) => {
        logger.info(`   ${index + 1}. ${code}`);
      });
    }

    if (codeHuntResults.implementationSectionCode.length > 0) {
      logger.info(`\n🎯 IMPLEMENTATION SECTION CODE:`);
      codeHuntResults.implementationSectionCode.forEach((code, index) => {
        logger.info(`   ${index + 1}. ${code}`);
      });
    }

    if (codeHuntResults.allInteractiveElements.length > 0) {
      logger.info(`\n🎛️ INTERACTIVE ELEMENTS:`);
      codeHuntResults.allInteractiveElements.slice(0, 10).forEach((element, index) => {
        logger.info(`   ${index + 1}. ${element}`);
      });
    }

    // Save detailed hunt results
    const outputPath = path.join('data', 'two_sum_code_hunt_results.json');
    await fs.ensureDir('data');
    await fs.writeJson(outputPath, {
      hunted_at: new Date().toISOString(),
      hunt_results: codeHuntResults,
      source_url: editorialUrl
    }, { spaces: 2 });
    
    logger.success(`💾 Code hunt results saved to: ${outputPath}`);

  } catch (error) {
    logger.error('❌ Code hunt failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Run the hunt
huntTwoSumApproach1Code().catch(console.error);
