import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Focused Two Sum Comments Scraper
 * Purpose: Perfect the topComments extraction with "Most Votes" sorting
 */

async function scrapeTwoSumTopComments(): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Starting Two Sum Top Comments Scraper...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Start from editorial page
    const editorialUrl = 'https://leetcode.com/problems/two-sum/editorial/';
    console.log(`📖 Navigating to editorial: ${editorialUrl}`);
    await page.goto(editorialUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Scroll to bottom to find comments section
    console.log('⬇️ Scrolling to bottom to find comments section...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(3000);

    // Look for comments section and sort dropdown
    console.log('🔍 Looking for comments section and sort dropdown...');
    
    // Try multiple approaches to find and click sort dropdown
    const sortSuccess = await page.evaluate(() => {
      // Look for sort dropdown near comments
      const sortSelectors = [
        'select[name*="sort"]',
        'select[name*="order"]', 
        '[data-testid*="sort"]',
        'select:has(option:contains("Most Votes"))',
        'select:has(option[value*="votes"])',
        '.sort-dropdown select',
        '[class*="sort"] select',
        'select option:has-text("Most Votes")'
      ];

      for (const selector of sortSelectors) {
        try {
          const selectElement = document.querySelector(selector) as HTMLSelectElement;
          if (selectElement) {
            console.log(`Found sort dropdown with selector: ${selector}`);
            
            // Look for "Most Votes" option
            const options = selectElement.querySelectorAll('option');
            for (let j = 0; j < options.length; j++) {
              const option = options[j];
              if (option.textContent?.toLowerCase().includes('most votes') || 
                  option.textContent?.toLowerCase().includes('votes') ||
                  option.value?.toLowerCase().includes('votes')) {
                console.log(`Selecting option: ${option.textContent}`);
                selectElement.value = option.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          }
        } catch (error) {
          // Continue with next selector
        }
      }

      // If no select dropdown found, look for clickable sort buttons
      const buttonSelectors = [
        'button:has-text("Most Votes")',
        '[data-value="most_votes"]',
        '[data-sort="votes"]',
        'button[aria-label*="sort"]',
        '.sort-button',
        '[class*="sort"][role="button"]'
      ];

      for (const selector of buttonSelectors) {
        try {
          const button = document.querySelector(selector) as HTMLElement;
          if (button && button.textContent?.toLowerCase().includes('votes')) {
            console.log(`Clicking sort button: ${selector}`);
            button.click();
            return true;
          }
        } catch (error) {
          // Continue with next selector
        }
      }

      return false;
    });

    if (sortSuccess) {
      console.log('✅ Successfully sorted by Most Votes');
      await page.waitForTimeout(3000); // Wait for sort to apply
    } else {
      console.log('⚠️ Could not find sort dropdown, proceeding with default order');
    }

    // Extract top 5 comments
    console.log('💬 Extracting top 5 comments...');
    const topComments = await page.evaluate(() => {
      const comments: { [key: string]: string } = {};
      const seenTexts = new Set<string>();
      let validCommentCount = 0;

      // Comprehensive comment selectors
      const commentSelectors = [
        '.comment',
        '.comment-item', 
        '.discuss-comment',
        '[data-testid*="comment"]',
        '.comment-content',
        '.comment-body',
        '.post-content',
        '.discussion-post',
        '.solution-comment',
        '[class*="comment"]',
        '[class*="discussion"]',
        '[class*="post"]',
        '.bg-layer-1', // LeetCode styling
        '.rounded.p-4' // LeetCode styling
      ];

      for (const selector of commentSelectors) {
        if (validCommentCount >= 5) break;
        
        const elements = document.querySelectorAll(selector);
        console.log(`Trying selector "${selector}": found ${elements.length} elements`);
        
        for (let i = 0; i < elements.length && validCommentCount < 5; i++) {
          const element = elements[i];
          const textContent = element.textContent?.trim() || '';
          
          // Filter for actual comment content (longer text, contains typical comment words)
          if (textContent.length > 50 && 
              (textContent.includes('solution') || 
               textContent.includes('approach') ||
               textContent.includes('algorithm') ||
               textContent.includes('complexity') ||
               textContent.includes('time') ||
               textContent.includes('space') ||
               textContent.match(/\d+\s*(ms|seconds?)/i) ||
               textContent.match(/O\([^)]+\)/))) {
            
            // Create normalized fingerprint for duplicate detection
            const normalizedText = textContent.toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/[^\w\s]/g, '')
              .substring(0, 200)
              .trim();
            
            // Skip duplicates
            if (!seenTexts.has(normalizedText)) {
              seenTexts.add(normalizedText);
              validCommentCount++;
              comments[`comment${validCommentCount}`] = textContent;
              console.log(`✅ Found comment ${validCommentCount}: ${textContent.substring(0, 100)}...`);
            }
          }
        }
      }

      // If still no comments found, try broader search
      if (validCommentCount === 0) {
        console.log('🔄 No comments found with specific selectors, trying broader search...');
        
        const allDivs = document.querySelectorAll('div');
        for (let i = 0; i < allDivs.length && validCommentCount < 5; i++) {
          const div = allDivs[i];
          const text = div.textContent?.trim() || '';
          
          // Look for content that contains comment-like patterns
          if (text.length > 100 && 
              (text.includes('Reply') || 
               text.includes('Show') || 
               text.includes('Read more') ||
               text.includes('votes') ||
               text.includes('upvote') ||
               text.match(/\d+[KM]?\s*(replies?|comments?)/i))) {
            
            const normalizedText = text.toLowerCase()
              .replace(/\s+/g, ' ')
              .substring(0, 200)
              .trim();
            
            if (!seenTexts.has(normalizedText)) {
              seenTexts.add(normalizedText);
              validCommentCount++;
              comments[`comment${validCommentCount}`] = text;
              console.log(`✅ Found comment ${validCommentCount} (broad search): ${text.substring(0, 100)}...`);
            }
          }
        }
      }

      return comments;
    });

    console.log(`📊 Successfully extracted ${Object.keys(topComments).length} comments`);

    // Display results
    if (Object.keys(topComments).length > 0) {
      console.log('\n💬 TOP COMMENTS EXTRACTED:');
      Object.entries(topComments).forEach(([key, content]) => {
        console.log(`\n${key.toUpperCase()}:`);
        console.log(`${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`);
      });
    } else {
      console.log('❌ No comments were extracted');
    }

    // Load existing working JSON and update it with topComments
    const workingFilePath = path.join(process.cwd(), 'data', 'complete_two_sum_editorial_working.json');
    
    if (await fs.pathExists(workingFilePath)) {
      console.log('\n📄 Updating existing working file with topComments...');
      const existingData = await fs.readJSON(workingFilePath);
      
      // Update topComments field
      existingData.solution.topComments = topComments;
      existingData.solution.summary.totalComments = Object.keys(topComments).length;
      existingData.solution.extractedAt = new Date().toISOString();
      
      // Save updated file
      await fs.writeJSON(workingFilePath, existingData, { spaces: 2 });
      console.log(`✅ Updated ${workingFilePath} with ${Object.keys(topComments).length} comments`);
    }

    // Also save just the comments for review
    const commentsOnlyPath = path.join(process.cwd(), 'data', 'two_sum_top_comments_only.json');
    await fs.writeJSON(commentsOnlyPath, {
      extractedAt: new Date().toISOString(),
      sourceUrl: editorialUrl,
      totalComments: Object.keys(topComments).length,
      topComments: topComments
    }, { spaces: 2 });
    
    console.log(`💾 Comments also saved separately to: ${commentsOnlyPath}`);

  } catch (error) {
    console.error('❌ Error during comment scraping:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Run the focused comments scraper
scrapeTwoSumTopComments().catch(console.error);
