import { RobustProblemScraper } from '../scrapers/robustProblemScraper';
import { Logger } from '../utils/logger';

/**
 * Dedicated test for Two Sum Editorial - Comments section extraction
 * Purpose: Extract comments from the editorial tab comments section with "Most Votes" sorting
 */

async function testTwoSumComments() {
  const logger = new Logger();
  logger.info('🔍 Testing Two Sum Editorial - Comments Section Extraction...');

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

    // Scroll to the bottom to find the comments section
    logger.info('📜 Scrolling to comments section...');
    await scraper['page'].evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await scraper['delay'](3000);

    // First, let's debug what's actually on the page
    const pageDebug = await scraper['page'].evaluate(() => {
      const debugInfo = {
        allCommentTexts: [] as string[],
        allElementsWithCommentInText: [] as string[],
        allTextContents: [] as string[]
      };

      // Get all text on the page that contains "comment" (case insensitive)
      const allElements = document.querySelectorAll('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const text = element.textContent?.trim() || '';
        
        if (text.toLowerCase().includes('comment') && text.length < 100) {
          debugInfo.allCommentTexts.push(`Element: ${element.tagName}, Text: "${text}"`);
        }
        
        // Look specifically for any text that looks like "Comments (number)"
        if (text.match(/comment/i) && text.match(/\d/)) {
          debugInfo.allElementsWithCommentInText.push(`${element.tagName}: "${text}"`);
        }
      }

      // Get some sample text content from the page to understand structure
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, p, div, span');
      for (let i = 0; i < Math.min(textElements.length, 50); i++) {
        const text = textElements[i].textContent?.trim() || '';
        if (text.length > 10 && text.length < 200) {
          debugInfo.allTextContents.push(text);
        }
      }

      return debugInfo;
    });

    logger.info(`\n🔍 PAGE DEBUGGING INFO:`);
    logger.info(`📝 Found ${pageDebug.allCommentTexts.length} elements with 'comment' in text:`);
    pageDebug.allCommentTexts.forEach((text, index) => {
      logger.info(`   ${index + 1}. ${text}`);
    });

    logger.info(`\n📝 Found ${pageDebug.allElementsWithCommentInText.length} elements with 'comment' and numbers:`);
    pageDebug.allElementsWithCommentInText.forEach((text, index) => {
      logger.info(`   ${index + 1}. ${text}`);
    });

    logger.info(`\n📄 Sample page content (first 20):`);
    pageDebug.allTextContents.slice(0, 20).forEach((text, index) => {
      logger.info(`   ${index + 1}. ${text}`);
    });

      // Look for and interact with the comments section - much more targeted approach
      const commentsData = await scraper['page'].evaluate(async () => {
        const results = {
          foundCommentsSection: false,
          foundSortDropdown: false,
          clickedMostVotes: false,
          extractedComments: [] as string[],
          debugInfo: {
            commentsHeaderText: '',
            sortDropdownText: '',
            actualElementsFound: [] as string[],
            htmlStructure: ''
          }
        };

        // Look for the actual comments structure as shown in the screenshot
        // The comments section should be below the editorial content
        
        // First, let's find elements that contain "Comments" followed by a count in parentheses
        // but exclude script/style/CSS content
        const allTextElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, span, p, section, article');
        
        for (let i = 0; i < allTextElements.length; i++) {
          const element = allTextElements[i];
          const textContent = element.textContent?.trim() || '';
          
          // Look for the exact pattern: "Comments (number)" but exclude CSS/JS content
          if (textContent.includes('Comments (') && 
              textContent.match(/Comments\s*\(\s*[\d,]+\.?\d*[KM]?\s*\)/i) && 
              textContent.length < 200 && // Comments header should be reasonably short
              !textContent.includes('.ͼ') && // Not CSS
              !textContent.includes('function')) { // Not JS
            
            results.foundCommentsSection = true;
            results.debugInfo.commentsHeaderText = textContent;
            results.debugInfo.htmlStructure = element.outerHTML.substring(0, 200) + '...';
            
            // Now look for sort dropdown in the vicinity or in the same text
            const parentContainer = element.closest('div, section, article') || element.parentElement;
            if (parentContainer) {
              // Check if sort controls are embedded in the same text (like "Comments (2.6K)Sort by:Best")
              if (textContent.includes('Sort by') || textContent.includes('sort')) {
                results.foundSortDropdown = true;
                results.debugInfo.sortDropdownText = 'Found sort controls in comments header';
                results.clickedMostVotes = true; // Assume we can work with current sorting
              } else {
                // Look for separate sort elements nearby
                const sortElements = parentContainer.querySelectorAll('select, button, [role="combobox"], [class*="sort"], [class*="dropdown"]');
                
                for (let j = 0; j < sortElements.length; j++) {
                  const sortElement = sortElements[j];
                  const sortText = sortElement.textContent?.toLowerCase() || '';
                  const placeholder = sortElement.getAttribute('placeholder')?.toLowerCase() || '';
                  const title = sortElement.getAttribute('title')?.toLowerCase() || '';
                  
                  if (sortText.includes('sort') || sortText.includes('most votes') || 
                      placeholder.includes('sort') || title.includes('sort') ||
                      sortText.includes('votes') || sortText.includes('best')) {
                    
                    results.foundSortDropdown = true;
                    results.debugInfo.sortDropdownText = sortElement.textContent?.trim() || '';
                    
                    // Try to interact with sort dropdown
                    try {
                      if (sortElement.tagName === 'SELECT') {
                        const options = sortElement.querySelectorAll('option');
                        for (let k = 0; k < options.length; k++) {
                          const option = options[k] as HTMLOptionElement;
                          const optionText = option.textContent?.toLowerCase() || '';
                          if (optionText.includes('most votes') || optionText.includes('votes')) {
                            option.selected = true;
                            sortElement.dispatchEvent(new Event('change', { bubbles: true }));
                            results.clickedMostVotes = true;
                            break;
                          }
                        }
                      } else {
                        // For buttons/divs, try clicking
                        (sortElement as HTMLElement).click();
                        results.clickedMostVotes = true;
                      }
                    } catch (e) {
                      // Continue
                    }
                    break;
                  }
                }
              }
              
              // Wait for potential re-sort
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Now look for individual comment elements in the comments container
              const commentsContainer = parentContainer.parentElement || parentContainer;
              
              // Look for comment container elements - target the top-level comment divs
              // Based on the debug output, look for divs with border classes that contain full comments
              const potentialComments = commentsContainer.querySelectorAll('div[class*="border"], div[class*="pt-4"], div[class*="transition"]');
              
              for (let j = 0; j < potentialComments.length && results.extractedComments.length < 5; j++) {
                const commentEl = potentialComments[j];
                let commentText = commentEl.textContent?.trim() || '';
                
                // Check if this looks like a complete user comment (not a sub-element)
                if (commentText.length > 50 && commentText.length < 2000 && // Complete comments should be longer
                    !commentText.includes('function()') && // Not JS
                    !commentText.includes('getElementById') && // Not JS
                    !commentText.includes('.ͼ') && // Not CSS
                    !commentText.includes('localStorage') && // Not JS
                    !commentText.includes('querySelector') && // Not JS
                    !commentText.includes('addEventListener')) { // Not JS
                  
                  // Look for complete comment patterns - must have username AND content AND actions
                  const hasReplyPattern = commentText.includes('Reply');
                  const hasVotePattern = commentText.match(/\d+[KM]?\s*(Show|Replies)/i);
                  const hasDatePattern = commentText.match(/\w+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2},?\s*\d{4})/i);
                  const hasUserPattern = commentText.match(/^[A-Za-z]+[A-Za-z0-9_]*\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d)/i);
                  
                  // A complete comment should have username, date, and reply functionality
                  if (hasReplyPattern && hasDatePattern && hasUserPattern && hasVotePattern) {
                    // Check for associated code blocks within this comment container
                    const codeBlocks = commentEl.querySelectorAll('code, pre, [class*="code"], [class*="highlight"], [class*="syntax"]');
                    let codeContent = '';
                    
                    if (codeBlocks.length > 0) {
                      // Extract code content from code blocks
                      const codeTexts: string[] = [];
                      codeBlocks.forEach((codeBlock) => {
                        const code = codeBlock.textContent?.trim() || '';
                        // Only include substantial code blocks (not just single words or operators)
                        if (code.length > 20 && 
                            (code.includes('{') || code.includes('function') || code.includes('def ') || 
                             code.includes('class ') || code.includes('var ') || code.includes('let ') ||
                             code.includes('const ') || code.includes('public ') || code.includes('private ') ||
                             code.includes('=') && code.includes(';'))) {
                          codeTexts.push(code);
                        }
                      });
                      
                      if (codeTexts.length > 0) {
                        codeContent = '\n\n[CODE BLOCK(S)]:\n' + codeTexts.map((code, idx) => 
                          `--- Code Block ${idx + 1} ---\n${code}\n--- End Code Block ${idx + 1} ---`
                        ).join('\n\n');
                      }
                    }
                    
                    // Enhanced comment extraction: try to get structured content
                    let enhancedComment = commentText;
                    
                    // Try to parse the comment structure for better formatting
                    const usernameMatch = commentText.match(/^([A-Za-z]+[A-Za-z0-9_]*)\s+/);
                    const dateMatch = commentText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i);
                    
                    if (usernameMatch && dateMatch) {
                      const username = usernameMatch[1];
                      const date = dateMatch[0];
                      
                      // Try to extract the main comment content (between date and Reply/Show buttons)
                      const afterDate = commentText.substring(commentText.indexOf(date) + date.length);
                      const beforeActions = afterDate.split(/(?:Reply|Show \d+|Read more)/)[0]?.trim();
                      
                      if (beforeActions && beforeActions.length > 10) {
                        enhancedComment = `👤 ${username} (${date}):\n${beforeActions}${codeContent}`;
                      } else {
                        enhancedComment = commentText + codeContent;
                      }
                    } else {
                      enhancedComment = commentText + codeContent;
                    }
                    
                    // More strict duplicate checking - check if this is a substring of an existing comment
                    const isDuplicate = results.extractedComments.some(existing => 
                      existing.includes(commentText.substring(0, 50)) || 
                      commentText.includes(existing.substring(0, 50))
                    );
                    
                    if (!isDuplicate) {
                      results.extractedComments.push(enhancedComment);
                      results.debugInfo.actualElementsFound.push(`Element: ${commentEl.tagName}, Class: ${commentEl.className.substring(0, 50)}..., Text: ${commentText.substring(0, 100)}..., Code Blocks: ${codeBlocks.length}`);
                    }
                  }
                }
              }
              
              // If we didn't find enough complete comments, try a different approach
              if (results.extractedComments.length < 3) {
                // Look for any div that contains both a date pattern and reply pattern (indicating a complete comment)
                const allDivs = commentsContainer.querySelectorAll('div');
                
                for (let j = 0; j < allDivs.length && results.extractedComments.length < 5; j++) {
                  const commentEl = allDivs[j];
                  let commentText = commentEl.textContent?.trim() || '';
                  
                  // Look for elements that contain a complete comment structure
                  if (commentText.length > 100 && commentText.length < 3000 &&
                      commentText.match(/[A-Za-z]+[A-Za-z0-9_]*\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2},?\s*\d{4})/i) &&
                      commentText.includes('Reply') &&
                      (commentText.includes('Show') || commentText.includes('Read more')) &&
                      !commentText.includes('function()') &&
                      !commentText.includes('.ͼ')) {
                    
                    // Check for associated code blocks within this comment container
                    const codeBlocks = commentEl.querySelectorAll('code, pre, [class*="code"], [class*="highlight"], [class*="syntax"]');
                    let codeContent = '';
                    
                    if (codeBlocks.length > 0) {
                      // Extract code content from code blocks
                      const codeTexts: string[] = [];
                      codeBlocks.forEach((codeBlock) => {
                        const code = codeBlock.textContent?.trim() || '';
                        // Only include substantial code blocks (not just single words or operators)
                        if (code.length > 20 && 
                            (code.includes('{') || code.includes('function') || code.includes('def ') || 
                             code.includes('class ') || code.includes('var ') || code.includes('let ') ||
                             code.includes('const ') || code.includes('public ') || code.includes('private ') ||
                             code.includes('=') && code.includes(';'))) {
                          codeTexts.push(code);
                        }
                      });
                      
                      if (codeTexts.length > 0) {
                        codeContent = '\n\n[CODE BLOCK(S)]:\n' + codeTexts.map((code, idx) => 
                          `--- Code Block ${idx + 1} ---\n${code}\n--- End Code Block ${idx + 1} ---`
                        ).join('\n\n');
                      }
                    }
                    
                    // Enhanced comment extraction: try to get structured content
                    let enhancedComment = commentText;
                    
                    // Try to parse the comment structure for better formatting
                    const usernameMatch = commentText.match(/^([A-Za-z]+[A-Za-z0-9_]*)\s+/);
                    const dateMatch = commentText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i);
                    
                    if (usernameMatch && dateMatch) {
                      const username = usernameMatch[1];
                      const date = dateMatch[0];
                      
                      // Try to extract the main comment content (between date and Reply/Show buttons)
                      const afterDate = commentText.substring(commentText.indexOf(date) + date.length);
                      const beforeActions = afterDate.split(/(?:Reply|Show \d+|Read more)/)[0]?.trim();
                      
                      if (beforeActions && beforeActions.length > 10) {
                        enhancedComment = `👤 ${username} (${date}):\n${beforeActions}${codeContent}`;
                      } else {
                        enhancedComment = commentText + codeContent;
                      }
                    } else {
                      enhancedComment = commentText + codeContent;
                    }
                    
                    // Check if this is truly a unique comment
                    const isNewComment = !results.extractedComments.some(existing => {
                      const existingStart = existing.substring(0, 30);
                      const currentStart = commentText.substring(0, 30);
                      return existingStart === currentStart;
                    });
                    
                    if (isNewComment) {
                      results.extractedComments.push(enhancedComment);
                      results.debugInfo.actualElementsFound.push(`Element: ${commentEl.tagName}, Class: ${commentEl.className.substring(0, 50)}..., Text: ${commentText.substring(0, 100)}..., Code Blocks: ${codeBlocks.length}`);
                    }
                  }
                }
              }
            }
            break; // Found the comments section, stop looking
          }
        }

        return results;
      });    // Log results
    logger.info(`📊 Comments Section Analysis Results:`);
    logger.info(`✅ Found Comments Section: ${commentsData.foundCommentsSection}`);
    logger.info(`✅ Found Sort Dropdown: ${commentsData.foundSortDropdown}`);
    logger.info(`✅ Clicked Most Votes: ${commentsData.clickedMostVotes}`);
    logger.info(`✅ Extracted Comments: ${commentsData.extractedComments.length}`);
    
    if (commentsData.debugInfo.commentsHeaderText) {
      logger.info(`📝 Comments Header: "${commentsData.debugInfo.commentsHeaderText}"`);
    }
    
    if (commentsData.debugInfo.sortDropdownText) {
      logger.info(`📋 Sort Dropdown Text: "${commentsData.debugInfo.sortDropdownText}"`);
    }
    
    logger.info(`🔍 Actual Elements Found: ${commentsData.debugInfo.actualElementsFound.length}`);

    if (commentsData.extractedComments.length > 0) {
      logger.success(`\n✅ COMMENTS EXTRACTED!`);
      commentsData.extractedComments.forEach((comment, index) => {
        logger.info(`\n💬 Comment ${index + 1}:`);
        logger.info(`   ${comment.substring(0, 200)}${comment.length > 200 ? '...' : ''}`);
      });
      
      if (commentsData.debugInfo.actualElementsFound.length > 0) {
        logger.info(`\n📋 Element Details Found:`);
        commentsData.debugInfo.actualElementsFound.forEach((text, index) => {
          logger.info(`   ${index + 1}. ${text}`);
        });
      }
    } else {
      logger.warn(`\n⚠️ NO COMMENTS EXTRACTED`);
      logger.info(`💡 Comments Header: "${commentsData.debugInfo.commentsHeaderText}"`);
      logger.info(`💡 Sort Dropdown: "${commentsData.debugInfo.sortDropdownText}"`);
      logger.info(`💡 HTML Structure: ${commentsData.debugInfo.htmlStructure}`);
      logger.info(`💡 Elements Found: ${commentsData.debugInfo.actualElementsFound.length}`);
    }

  } catch (error) {
    logger.error('❌ Test failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Run the test
testTwoSumComments().catch(console.error);
