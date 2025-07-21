import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { ScrapingConfig } from '../types';
import { Logger } from './logger';

export class BaseScraper {
  protected browser?: Browser;
  protected context?: BrowserContext;
  protected page?: Page;
  protected logger: Logger;
  protected config: ScrapingConfig;

  constructor(config?: Partial<ScrapingConfig>) {
    this.logger = new Logger();
    this.config = {
      maxConcurrency: 3,
      delayBetweenRequests: 2000,
      timeout: 60000,
      retries: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headless: false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('🌐 Initializing browser...');
      
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: this.config.userAgent,
        viewport: { width: 1920, height: 1080 },
        // Add some stealth settings
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });

      this.page = await this.context.newPage();
      
      // Set timeout
      this.page.setDefaultTimeout(this.config.timeout);
      
      this.logger.success('✅ Browser initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async navigate(url: string, waitForSelector?: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      this.logger.info(`🔗 Navigating to: ${url}`);
      
      // Navigate with longer timeout and better options
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout 
      });

      // Wait for page to stabilize
      await this.delay(2000);

      if (waitForSelector) {
        await this.page.waitForSelector(waitForSelector, { 
          timeout: this.config.timeout 
        });
      }

      // Random delay to seem more human-like
      await this.delay(this.config.delayBetweenRequests);
      
    } catch (error) {
      this.logger.error(`❌ Failed to navigate to ${url}:`, error);
      throw error;
    }
  }

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retry<T>(fn: () => Promise<T>, retries: number = this.config.retries): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`⚠️ Attempt ${i + 1} failed, ${retries - i} retries left:`, error);
        
        if (i < retries) {
          await this.delay(1000 * (i + 1)); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      this.logger.info('🧹 Browser cleanup completed');
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error);
    }
  }

  async screenshot(filename: string): Promise<void> {
    if (!this.page) return;
    
    try {
      await this.page.screenshot({ 
        path: `screenshots/${filename}`, 
        fullPage: true 
      });
      this.logger.info(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      this.logger.error('❌ Failed to take screenshot:', error);
    }
  }
}
