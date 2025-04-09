const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Get URL from command line argument
const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error('Please provide a URL as an argument');
    console.error('Usage: node main.js <url>');
    process.exit(1);
}

const puppeteerOptions = {
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
    ]
};

async function takeScreenshot(targetUrl) {
    try {
        console.log(`Starting screenshot process for URL: ${targetUrl}`);
        // Create screenshots directory if it doesn't exist
        const screenshotsDir = path.join(__dirname, 'screenshots');
        await fs.mkdir(screenshotsDir, { recursive: true });
        console.log(`Created/verified screenshots directory at: ${screenshotsDir}`);

        // Generate filename from URL
        const parsedUrl = new url.URL(targetUrl);
        const pathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
        const filename = `${parsedUrl.hostname}${pathname.replace(/\//g, '_')}.png`;
        const outputPath = path.join(screenshotsDir, filename);

        const browser = await puppeteer.launch(puppeteerOptions);
        console.log('Browser launched successfully');
        const page = await browser.newPage();
        console.log('New page created');

        // Enable JavaScript for better compatibility
        await page.setJavaScriptEnabled(true);

        // Modify request interception to be less aggressive
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['media', 'websocket', 'manifest'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.setViewport({ width: 1366, height: 768 });

        // Set a common browser User-Agent and other headers
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        });

        console.log('Attempting to navigate to page...');
        const response = await page.goto(targetUrl, {
            waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
            timeout: 30000
        }).catch(error => {
            if (error.name === 'TimeoutError') {
                throw new Error(`Navigation timeout after 30 seconds. This might be due to slow network or server response.`);
            }
            throw error;
        });

        // Add initial render wait
        console.log('Waiting for initial render...');
        await page.waitForTimeout(2000);

        if (!response) {
            throw new Error('Failed to get page response - the page might not exist');
        }

        if (response.status() >= 400) {
            throw new Error(`HTTP error! Status: ${response.status()} (${response.statusText()})`);
        }
        console.log(`Page loaded successfully with status: ${response.status()}`);

        // Force page visibility and remove overlay elements
        console.log('Ensuring page content visibility...');
        await page.evaluate(() => {
            // Force show the body and html
            document.documentElement.style.display = 'block';
            document.body.style.display = 'block';
            document.body.style.visibility = 'visible';
            document.documentElement.style.visibility = 'visible';

            // Remove potential overlay elements
            const removeSelectors = [
                '[class*="cookie"]',
                '[class*="popup"]',
                '[class*="modal"]',
                '[class*="overlay"]',
                '[id*="cookie"]',
                '[id*="popup"]',
                '[id*="modal"]',
                '[id*="overlay"]'
            ];

            removeSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    element.remove();
                });
            });

            // Force all elements to be visible
            const elements = document.getElementsByTagName('*');
            for (let element of elements) {
                const style = window.getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    element.style.display = 'block';
                    element.style.visibility = 'visible';
                }
            }
        });

        // Wait for content to be visible
        console.log('Waiting for visible content...');
        try {
            await page.waitForFunction(() => {
                const body = document.body;
                const html = document.documentElement;
                
                // Check if body has content
                const hasContent = body.innerText.length > 0;
                
                // Check if body has visible dimensions
                const hasSize = body.offsetWidth > 0 && body.offsetHeight > 0;
                
                // Check if any images are loaded
                const images = document.images;
                const hasLoadedImages = Array.from(images).some(img => img.complete);
                
                return hasContent && hasSize && hasLoadedImages;
            }, { timeout: 5000 });
        } catch (error) {
            console.log('Warning: Content visibility check failed:', error.message);
        }

        // Wait additional time after any cookie handling
        await page.waitForTimeout(1500);

        console.log('Taking screenshot...');
        try {
            // Final render wait before screenshot
            await page.waitForTimeout(2000);
            
            await page.screenshot({
                path: outputPath,
                type: 'png',
                fullPage: true
            });

            // Verify screenshot
            const stats = await fs.stat(outputPath);
            if (stats.size < 1000) {
                console.log('Warning: Small file size detected, waiting longer and retrying...');
                await page.waitForTimeout(3000);
                await page.screenshot({
                    path: outputPath,
                    type: 'png',
                    fullPage: true
                });
            }
        } catch (error) {
            console.error('Screenshot capture failed:', error.message);
            throw error;
        }

        await browser.close();
        console.log(`✓ Success! Screenshot saved to: ${outputPath}`);

    } catch (err) {
        console.error('Screenshot process failed!');
        console.error('Error details:', {
            message: err.message,
            type: err.name,
            stack: err.stack
        });
        process.exit(1);
    }
}

// Run the screenshot function
takeScreenshot(targetUrl);