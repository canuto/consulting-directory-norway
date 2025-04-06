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
        // Create screenshots directory if it doesn't exist
        const screenshotsDir = path.join(__dirname, 'screenshots');
        await fs.mkdir(screenshotsDir, { recursive: true });

        // Generate filename from URL
        const parsedUrl = new url.URL(targetUrl);
        const pathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
        const filename = `${parsedUrl.hostname}${pathname.replace(/\//g, '_')}.png`;
        const outputPath = path.join(screenshotsDir, filename);

        const browser = await puppeteer.launch(puppeteerOptions);
        const page = await browser.newPage();

        // Disable JavaScript and other features we don't need
        await page.setJavaScriptEnabled(false);

        // Block only scripts and unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['script', 'media', 'websocket', 'manifest'].includes(request.resourceType())) {
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

        const response = await page.goto(targetUrl, {
            waitUntil: 'networkidle0',
            timeout: 20000
        });

        if (!response) {
            throw new Error('Page not found');
        }

        if (response.status() >= 400) {
            throw new Error(`Page returned status code: ${response.status()}`);
        }

        // Try to click common cookie consent buttons
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
        } catch (e) {
            // Ignore errors if no cookie button is found
        }

        // Wait for network to be idle
        await page.waitForNetworkIdle();

        // Take screenshot and save to file
        await page.screenshot({
            path: outputPath,
            type: 'png'
        });

        await browser.close();
        console.log(`Screenshot saved to: ${outputPath}`);

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

// Run the screenshot function
takeScreenshot(targetUrl);