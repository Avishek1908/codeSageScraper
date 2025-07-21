import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';

interface EditorialData {
  question: string;
  solution: {
    approaches: Array<{
      title: string;
      complexity: {
        time: string;
        space: string;
      };
      description: string;
      intuition: string;
      algorithm: string;
      implementation: string;
      iframeImplementations?: string[];
    }>;
    iframeImplementations?: string[];
  };
  topComments: { [key: string]: string };
}

async function scrapeEditorialData(): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('Starting browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    const url = 'https://leetcode.com/problems/two-sum/editorial/';
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Extract question title and description
    console.log('Extracting question...');
    const question = await page.evaluate(() => {
      const titleElement = document.querySelector('[data-track-load="description_content"] h1, .css-v3d350, .text-title-large');
      const descElement = document.querySelector('[data-track-load="description_content"] .elfjS, .text-body, .content__u3I1 div[data-track-load="description_content"]');
      
      const title = titleElement?.textContent?.trim() || '';
      const description = descElement?.textContent?.trim() || '';
      
      return `${title} - ${description}`.replace(/\s+/g, ' ').trim();
    });

    console.log('Question extracted:', question);

    // Extract approaches
    console.log('Extracting approaches...');
    const approaches = await page.evaluate(() => {
      const approachElements = document.querySelectorAll('[id^="approach-"], .approach-item, section[class*="approach"], .relative.group');
      const approachesData = [];

      for (let i = 0; i < approachElements.length; i++) {
        const element = approachElements[i];
        
        const titleEl = element.querySelector('h4, h3, .text-title-medium, .font-medium');
        const title = titleEl?.textContent?.trim() || `Approach ${i + 1}`;

        // Extract complexity information
        const complexitySection = element.querySelector('.complexity-analysis, [class*="complexity"], .bg-fill-3, .rounded');
        let timeComplexity = 'Not specified';
        let spaceComplexity = 'Not specified';

        if (complexitySection) {
          const complexityText = complexitySection.textContent || '';
          const timeMatch = complexityText.match(/Time[^:]*:\s*([^\n,]+)/i);
          const spaceMatch = complexityText.match(/Space[^:]*:\s*([^\n,]+)/i);
          
          if (timeMatch) timeComplexity = timeMatch[1].trim();
          if (spaceMatch) spaceComplexity = spaceMatch[1].trim();
        }

        // Extract sections
        const descriptionEl = element.querySelector('p:first-of-type, .mb-2:first-of-type, div[class*="text"]:first-of-type');
        const description = descriptionEl?.textContent?.trim() || '';

        // Look for intuition
        let intuition = '';
        const intuitionEl = element.querySelector('[class*="intuition"]');
        if (intuitionEl) {
          intuition = intuitionEl.textContent?.trim() || '';
        } else {
          // Try to find intuition by looking for specific keywords
          const allPs = element.querySelectorAll('p');
          for (let idx = 0; idx < allPs.length; idx++) {
            const p = allPs[idx];
            const text = p.textContent?.toLowerCase() || '';
            if (text.includes('intuition') || text.includes('idea') || text.includes('approach')) {
              intuition = p.textContent?.trim() || '';
              break;
            }
          }
        }

        // Look for algorithm
        let algorithm = '';
        const algorithmEl = element.querySelector('[class*="algorithm"]');
        if (algorithmEl) {
          algorithm = algorithmEl.textContent?.trim() || '';
        } else {
          // Try to find algorithm description
          const allPs = element.querySelectorAll('p');
          for (let idx = 0; idx < allPs.length; idx++) {
            const p = allPs[idx];
            const text = p.textContent?.toLowerCase() || '';
            if (text.includes('algorithm') || text.includes('step') || text.includes('process')) {
              algorithm = p.textContent?.trim() || '';
              break;
            }
          }
        }

        // Extract implementation code
        const codeEl = element.querySelector('pre code, .language-cpp, .language-java, .language-python, .language-javascript, code');
        const implementation = codeEl?.textContent?.trim() || '';

        approachesData.push({
          title,
          complexity: {
            time: timeComplexity,
            space: spaceComplexity
          },
          description,
          intuition,
          algorithm,
          implementation
        });
      }

      return approachesData;
    });

    console.log(`Extracted ${approaches.length} approaches`);

    // Extract iframe implementations
    console.log('Extracting iframe implementations...');
    const iframeImplementations = await extractIframeImplementations(page);
    console.log(`Found ${iframeImplementations.length} iframe implementations`);

    // Navigate to comments section and extract top comments
    console.log('Extracting comments...');
    await page.click('a[href*="comments"], [data-cy="DiscussBtn"], button:has-text("Discuss")').catch(() => {
      console.log('Could not find discuss button, trying alternative...');
    });

    // Try alternative ways to get to comments
    try {
      await page.goto('https://leetcode.com/problems/two-sum/discuss/', { waitUntil: 'networkidle' });
    } catch (error) {
      console.log('Falling back to solutions page...');
      await page.goto('https://leetcode.com/problems/two-sum/solutions/', { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(3000);

    // Sort by Most Votes
    console.log('Sorting comments by Most Votes...');
    try {
      const sortButton = await page.locator('button:has-text("Most Votes"), [data-value="most_votes"], select option:has-text("Most Votes")').first();
      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Try dropdown approach
        const dropdown = await page.locator('select, [role="combobox"]').first();
        if (await dropdown.isVisible()) {
          await dropdown.selectOption({ label: 'Most Votes' });
          await page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      console.log('Could not sort by Most Votes:', error);
    }

    // Scroll to load more comments
    console.log('Scrolling to load comments...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }

    // Extract top 5 comments with duplicate detection
    const topComments = await page.evaluate(() => {
      const commentElements = document.querySelectorAll('.discuss-topic, .solution-topic, [data-cy="solution-item"], .bg-layer-1, .rounded.p-4');
      const comments: { [key: string]: string } = {};
      const seenTexts = new Set<string>(); // For duplicate detection
      
      let validCommentCount = 0;

      for (let i = 0; i < commentElements.length && validCommentCount < 5; i++) {
        const element = commentElements[i];
        const textContent = element.textContent?.trim() || '';
        
        if (textContent.length > 10) { // Minimum content check
          // Create a normalized fingerprint for duplicate detection
          const normalizedText = textContent.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
          
          // Skip if we've seen this content before (duplicate detection)
          if (!seenTexts.has(normalizedText)) {
            seenTexts.add(normalizedText);
            validCommentCount++;
            comments[`comment${validCommentCount}`] = textContent;
          }
        }
      }

      return comments;
    });

    console.log(`Extracted ${Object.keys(topComments).length} unique comments`);

    // Prepare final data structure
    const editorialData: EditorialData = {
      question,
      solution: {
        approaches: approaches,
        iframeImplementations: iframeImplementations
      },
      topComments
    };

    // Save to file
    const outputPath = path.join(process.cwd(), 'data', 'complete_two_sum_editorial_fixed.json');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJSON(outputPath, editorialData, { spaces: 2 });

    console.log(`Editorial data saved to: ${outputPath}`);
    console.log('Scraping completed successfully!');

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function extractIframeImplementations(page: Page): Promise<string[]> {
  console.log('Starting iframe extraction...');
  
  try {
    // Wait for any iframes to load
    await page.waitForTimeout(2000);
    
    // Get all iframe elements
    const iframes = await page.locator('iframe').all();
    console.log(`Found ${iframes.length} iframes`);
    
    const implementations: string[] = [];
    
    for (let i = 0; i < iframes.length; i++) {
      try {
        console.log(`Processing iframe ${i + 1}...`);
        
        // Try to get the iframe content
        const iframeContent = await iframes[i].contentFrame();
        if (iframeContent) {
          console.log(`Successfully accessed iframe ${i + 1} content`);
          
          // Wait for content to load
          try {
            await page.waitForTimeout(1000);
          } catch {}
          
          // Try different selectors for code content
          const codeSelectors = [
            'pre code',
            '.CodeMirror-code',
            '.monaco-editor',
            'textarea',
            '[class*="code"]',
            'code',
            'pre',
            '.cm-content',
            '.view-lines'
          ];
          
          for (const selector of codeSelectors) {
            try {
              const codeElements = await iframeContent.locator(selector).all();
              
              for (const codeElement of codeElements) {
                const codeText = await codeElement.textContent();
                if (codeText && codeText.trim().length > 20) {
                  console.log(`Found code in iframe ${i + 1}:`, codeText.substring(0, 100) + '...');
                  implementations.push(codeText.trim());
                }
              }
            } catch (selectorError) {
              // Continue with next selector
            }
          }
          
          // Also try to get all text content if no specific code found
          if (implementations.length === 0) {
            try {
              const allText = await iframeContent.locator('body').textContent();
              if (allText && allText.trim().length > 50) {
                console.log(`Found general content in iframe ${i + 1}`);
                implementations.push(allText.trim());
              }
            } catch (textError) {
              console.log(`Could not get text from iframe ${i + 1}:`, textError);
            }
          }
        } else {
          console.log(`Could not access iframe ${i + 1} content - possibly cross-origin`);
        }
      } catch (iframeError) {
        console.log(`Error processing iframe ${i + 1}:`, iframeError);
      }
    }
    
    console.log(`Total iframe implementations found: ${implementations.length}`);
    return implementations;
    
  } catch (error) {
    console.error('Error in iframe extraction:', error);
    return [];
  }
}

// Run the scraper
scrapeEditorialData().catch(console.error);
