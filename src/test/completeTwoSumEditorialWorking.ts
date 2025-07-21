import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';

interface EditorialData {
  question: string;
  solution: {
    problemId: string;
    title: string;
    extractedAt: string;
    sourceUrl: string;
    videoSolution?: {
      found: boolean;
      description: string;
      iframeUrl: string;
    };
    approaches: Array<{
      title: string;
      algorithm: string;
      implementation: string;
      complexityAnalysis: string;
      codeBlocks: string[];
      iframeUrl: string;
      fullContent: string;
    }>;
    iframeImplementations: Array<{
      src: string;
      id: string;
      content: string;
    }>;
    topComments: { [key: string]: string };
    summary: {
      totalApproaches: number;
      totalImplementations: number;
      hasVideoSolution: boolean;
      contentLength: number;
      totalComments: number;
    };
    debugInfo: {
      totalHeadings: number;
      totalIframes: number;
      contentSections: string[];
      stoppedAt: string;
    };
  };
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
    await page.waitForTimeout(5000);

    // Extract question title
    console.log('Extracting question...');
    const question = await page.evaluate(() => {
      const titleElement = document.querySelector('h1, .css-v3d350, .text-title-large');
      return titleElement?.textContent?.trim() || 'Two Sum';
    });

    console.log('Question extracted:', question);

    // Extract video solution
    console.log('Looking for video solution...');
    const videoSolution = await page.evaluate(() => {
      const videoIframe = document.querySelector('iframe[src*="vimeo"], iframe[src*="youtube"], iframe[src*="video"]');
      if (videoIframe) {
        return {
          found: true,
          description: "Video Solution",
          iframeUrl: videoIframe.getAttribute('src') || ''
        };
      }
      return null;
    });

    // Extract approaches and content
    console.log('Extracting approaches...');
    const contentData = await page.evaluate(() => {
      const approaches = [];
      const contentSections = [];
      let totalHeadings = 0;
      
      // Find approach sections
      const approachElements = document.querySelectorAll('h3, h4, .approach-title, [class*="approach"]');
      totalHeadings = approachElements.length;
      
      // Get all content paragraphs and elements
      const allContent = document.querySelectorAll('p, ul, ol, pre, code, div[class*="content"]');
      
      for (let i = 0; i < allContent.length; i++) {
        const element = allContent[i];
        const text = element.textContent?.trim();
        if (text && text.length > 10) {
          const tagName = element.tagName;
          const preview = text.substring(0, 50) + (text.length > 50 ? '...' : '');
          contentSections.push(`${tagName}: ${preview}`);
        }
      }

      // Extract approaches by looking for headings and following content
      const headings = document.querySelectorAll('h3, h4');
      
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const title = heading.textContent?.trim() || `Approach ${i + 1}`;
        
        if (title.toLowerCase().includes('approach') || title.toLowerCase().includes('brute') || title.toLowerCase().includes('hash')) {
          let fullContent = '';
          let algorithm = 'Algorithm';
          let implementation = 'Implementation';
          let complexityAnalysis = 'Complexity Analysis';
          
          // Get content between this heading and the next
          let currentElement = heading.nextElementSibling;
          while (currentElement && currentElement.tagName !== 'H3' && currentElement.tagName !== 'H4') {
            const text = currentElement.textContent?.trim();
            if (text) {
              fullContent += text + '\n\n';
              
              // Try to identify specific sections
              if (text.toLowerCase().includes('algorithm') && text.length > 20) {
                algorithm = text;
              }
              if (text.toLowerCase().includes('implementation') && text.length > 20) {
                implementation = text;
              }
              if (text.toLowerCase().includes('complexity') || text.toLowerCase().includes('time complexity')) {
                complexityAnalysis = text;
              }
            }
            currentElement = currentElement.nextElementSibling;
          }
          
          approaches.push({
            title,
            algorithm,
            implementation,
            complexityAnalysis,
            codeBlocks: [],
            iframeUrl: '',
            fullContent: fullContent.trim()
          });
        }
      }

      return {
        approaches,
        contentSections,
        totalHeadings
      };
    });

    // Extract iframe implementations
    console.log('Extracting iframe implementations...');
    const iframeImplementations = await extractIframeImplementations(page);
    console.log(`Found ${iframeImplementations.length} iframe implementations`);

    // Navigate to comments and extract top comments
    console.log('Extracting comments...');
    const topComments = await extractTopComments(page);
    console.log(`Extracted ${Object.keys(topComments).length} comments`);

    // Prepare final data structure
    const editorialData: EditorialData = {
      question,
      solution: {
        problemId: 'two-sum',
        title: 'Complete Editorial Solution: Two Sum',
        extractedAt: new Date().toISOString(),
        sourceUrl: url,
        videoSolution: videoSolution || undefined,
        approaches: contentData.approaches,
        iframeImplementations: iframeImplementations,
        topComments: topComments,
        summary: {
          totalApproaches: contentData.approaches.length,
          totalImplementations: iframeImplementations.length,
          hasVideoSolution: !!videoSolution,
          contentLength: 0,
          totalComments: Object.keys(topComments).length
        },
        debugInfo: {
          totalHeadings: contentData.totalHeadings,
          totalIframes: iframeImplementations.length,
          contentSections: contentData.contentSections,
          stoppedAt: "Extraction completed successfully"
        }
      }
    };

    // Save to file
    const outputPath = path.join(process.cwd(), 'data', 'complete_two_sum_editorial_working.json');
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

async function extractIframeImplementations(page: Page): Promise<Array<{src: string, id: string, content: string}>> {
  console.log('Starting iframe extraction...');
  
  try {
    // Wait for iframes to load
    await page.waitForTimeout(3000);
    
    // Get all iframe elements
    const iframes = await page.locator('iframe').all();
    console.log(`Found ${iframes.length} iframes`);
    
    const implementations = [];
    
    for (let i = 0; i < iframes.length; i++) {
      try {
        console.log(`Processing iframe ${i + 1}...`);
        
        // Get iframe src
        const src = await iframes[i].getAttribute('src') || '';
        console.log(`Iframe ${i + 1} src:`, src);
        
        if (src.includes('playground') || src.includes('leetcode')) {
          // Try to get the iframe content
          const frame = await iframes[i].contentFrame();
          if (frame) {
            console.log(`Successfully accessed iframe ${i + 1} content`);
            
            // Wait for content to load
            await page.waitForTimeout(2000);
            
            // Try different selectors for code content
            const codeSelectors = [
              'pre code',
              '.CodeMirror-code',
              '.monaco-editor .view-lines',
              'textarea',
              '[class*="code"]',
              'code',
              'pre',
              '.cm-content',
              '.view-lines',
              '.CodeMirror-line'
            ];
            
            let codeContent = '';
            
            for (const selector of codeSelectors) {
              try {
                const elements = await frame.locator(selector).all();
                
                for (const element of elements) {
                  const text = await element.textContent();
                  if (text && text.trim().length > 20 && (text.includes('class') || text.includes('function') || text.includes('def') || text.includes('vector'))) {
                    console.log(`Found code in iframe ${i + 1}:`, text.substring(0, 100) + '...');
                    codeContent = text.trim();
                    break;
                  }
                }
                
                if (codeContent) break;
              } catch (selectorError) {
                // Continue with next selector
              }
            }
            
            // If still no code found, try getting all text
            if (!codeContent) {
              try {
                const allText = await frame.locator('body').textContent();
                if (allText && allText.trim().length > 50) {
                  console.log(`Found general content in iframe ${i + 1}`);
                  codeContent = allText.trim();
                }
              } catch (textError) {
                console.log(`Could not get text from iframe ${i + 1}:`, textError);
              }
            }
            
            if (codeContent) {
              implementations.push({
                src: src,
                id: `iframe-${i + 1}`,
                content: codeContent
              });
            }
          } else {
            console.log(`Could not access iframe ${i + 1} content - possibly cross-origin`);
          }
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

async function extractTopComments(page: Page): Promise<{ [key: string]: string }> {
  try {
    console.log('Extracting comments from editorial page...');
    
    // Stay on the editorial page and look for comment-like content
    // Scroll down to ensure all content is loaded
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // Extract comments using the approach that worked in your original file
    const comments = await page.evaluate(() => {
      const extractedComments: { [key: string]: string } = {};
      const seenTexts = new Set<string>();
      let validCommentCount = 0;
      
      // Look for comment-like content on the editorial page itself
      // Based on your original success, these are likely user-generated content sections
      const potentialCommentElements = document.querySelectorAll('div, span, p');
      
      for (let i = 0; i < potentialCommentElements.length && validCommentCount < 5; i++) {
        const element = potentialCommentElements[i];
        
        const textContent = element.textContent?.trim() || '';
        
        // Look for content that matches your original comment patterns
        // Your original had: "freeNeasySep 24, 2018My first leetcode,keep going.Read more5KShow 134 RepliesReply"
        if (textContent.length > 20 && 
            (textContent.includes('leetcode') || 
             textContent.includes('Read more') || 
             textContent.includes('Reply') ||
             textContent.includes('Show') ||
             textContent.match(/\d+[KM]?\s*(Show|Replies|Reply)/i) ||
             textContent.match(/[A-Za-z]+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{2},\s*\d{4})/))) {
          
          // Create fingerprint for duplicate detection
          const fingerprint = textContent.toLowerCase()
            .replace(/\s+/g, ' ')
            .substring(0, 100)
            .trim();
          
          if (!seenTexts.has(fingerprint)) {
            seenTexts.add(fingerprint);
            validCommentCount++;
            extractedComments[`comment${validCommentCount}`] = textContent;
          }
        }
      }
      
      return extractedComments;
    });

    console.log(`Extracted ${Object.keys(comments).length} comments from editorial page`);
    return comments;

  } catch (error) {
    console.error('Error extracting comments:', error);
    return {};
  }
}

// Run the scraper
scrapeEditorialData().catch(console.error);
