const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Get URL from command line argument
const targetUrl = process.argv[2];
const screenshotsDir = process.argv[3] || path.join(__dirname, 'screenshots');

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
        await fs.mkdir(screenshotsDir, { recursive: true });
        console.log(`Created/verified screenshots directory at: ${screenshotsDir}`);

        // Generate filename from URL
        const parsedUrl = new url.URL(targetUrl);
        const pathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
        const filename = `${parsedUrl.hostname}${pathname.replace(/\//g, '_')}.png`;
        const outputPath = path.join(screenshotsDir, filename);
        // Check if screenshot already exists
        try {
            await fs.access(outputPath);
            console.log(`Screenshot already exists at: ${outputPath}`);
            process.exit(0);
        } catch (err) {
            // File doesn't exist, continue with screenshot
            console.log(`Screenshot will be saved to: ${outputPath}`);
        }
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
            waitUntil: 'networkidle0',
            timeout: 20000
        }).catch(error => {
            if (error.name === 'TimeoutError') {
                throw new Error(`Navigation timeout after 20 seconds. This might be due to slow network or server response.`);
            }
            throw error;
        });

        if (!response) {
            throw new Error('Failed to get page response - the page might not exist');
        }

        if (response.status() >= 400) {
            throw new Error(`HTTP error! Status: ${response.status()} (${response.statusText()})`);
        }
        console.log(`Page loaded successfully with status: ${response.status()}`);

        // Try to click common cookie consent buttons
        console.log('Attempting to handle cookie consent popups...');
        try {
            await Promise.race([
                page.click('button[id*="accept"]'),
                page.click('button[class*="accept"]'),
                page.click('button[id*="cookie"]'),
                page.click('button[class*="cookie"]'),
                page.click('[aria-label*="accept"]'),
                page.click('[aria-label*="cookie"]'),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
            console.log('Finished cookie consent handling');
        } catch (e) {
            console.log('No cookie consent buttons found or interaction failed');
        }

        console.log('Waiting for network to become idle...');
        try {
            await Promise.race([
                page.waitForNetworkIdle(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Network idle timeout after 5 seconds')), 5000)
                )
            ]);
            console.log('Network is idle');
        } catch (error) {
            console.log('Warning: Network did not become idle - continuing anyway:', error.message);
            // Continue execution instead of failing
        }

        // Add a small delay before screenshot to allow for rendering
        console.log('Taking screenshot...');
        try {
            
            await page.screenshot({
                path: outputPath,
                type: 'png',
                fullPage: false // Capture the full page height
            });
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