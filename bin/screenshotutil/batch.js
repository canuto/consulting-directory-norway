const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Get JSON file path from command line argument
const jsonPath = process.argv[2];
// Get screenshots directory from command line argument
const screenshotsDir = process.argv[3] || path.join(__dirname, 'screenshots');

if (!jsonPath) {
    console.error('Please provide a path to JSON file');
    console.error('Usage: node batch.js <path-to-json>');
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

async function processListingsFile(jsonFilePath) {
    try {
        // Create screenshots directory if it doesn't exist
        
        await fs.mkdir(screenshotsDir, { recursive: true });
        // Read and parse JSON file
        const jsonContent = await fs.readFile(path.resolve(jsonFilePath), 'utf8');
        const listings = JSON.parse(jsonContent);

        // Create a single browser instance for all screenshots
        const browser = await puppeteer.launch(puppeteerOptions);

        console.log(`Found ${listings.length} listings to process`);

        // Process each listing
        for (let i = 0; i < listings.length; i++) {
            const listing = listings[i];
            if (!listing.siteUrl) {
                console.warn(`Skipping listing ${i + 1}: No URL found`);
                continue;
            }

            console.log(`Processing ${i + 1}/${listings.length}: ${listing.siteUrl}`);
            
            try {
                

                // Generate filename from URL
                const parsedUrl = new url.URL(listing.siteUrl);
                const pathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
                const filename = `${parsedUrl.hostname}${pathname.replace(/\//g, '_')}.png`;
                const outputPath = path.join(screenshotsDir, filename);
                // Skip if screenshot already exists
                try {
                    await fs.access(outputPath);
                    console.log(`Screenshot already exists for ${listing.siteUrl}, skipping...`);
                    continue;
                } catch (err) {
                    // File doesn't exist, continue with screenshot
                }
                const page = await browser.newPage();

                // Disable JavaScript and other features we don't need
                await page.setJavaScriptEnabled(true);

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

                // Set headers
                await page.setExtraHTTPHeaders({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                });

                const response = await page.goto(listing.siteUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 20000
                });

                if (!response || response.status() >= 400) {
                    throw new Error(`Failed with status: ${response ? response.status() : 'No response'}`);
                }

                // Handle cookie consent
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

                // Take screenshot
                await page.screenshot({
                    path: outputPath,
                    type: 'png'
                });

                await page.close();
                console.log(`✓ Screenshot saved: ${outputPath}`);

            } catch (err) {
                console.error(`✗ Failed to process ${listing.siteUrl}: ${err.message}`);
            }
        }

        await browser.close();
        console.log('All listings processed');

    } catch (err) {
        console.error('Error processing JSON file:', err.message);
        process.exit(1);
    }
}

// Run the process
processListingsFile(jsonPath);
