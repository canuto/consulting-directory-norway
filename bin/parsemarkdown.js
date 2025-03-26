const fs = require('fs');

function parseMarkdownToListings(markdownContent) {
    const listings = [];
    let currentCategory = '';
    let currentCategorySlug = '';
    let lastParentTitle = '';
    let lastParentUrl = '';

    // Split content into lines
    const lines = markdownContent.split('\n');

    for (let line of lines) {
        line = line.trim();

        // Skip "Back to Top" links and continue with next line
        if (line.includes('Back to Top')) {
            continue;
        }

        // Parse category (level 2 headers)
        if (line.startsWith('## ')) {
            const newCategory = line.replace('## ', '').trim();
            // Only update category if we have a non-empty one
            if (newCategory) {
                currentCategory = newCategory;
                currentCategorySlug = currentCategory
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }
            continue;
        }

        // Parse listings (bullet points)
        if (line.match(/^\s*\*/)) {  // Match any line starting with * including indented ones
            // Skip if we don't have a category yet
            if (!currentCategory) {
                continue;
            }
            
            let title = '';
            let siteUrl = '';
            let content = '';
            
            // Check if it's a sub-bullet (indented)
            const isSubBullet = line.startsWith('    * ') || line.startsWith('\t* ');
            
            // Check if the line contains a markdown link pattern [title](url) followed by content
            const fullMatch = line.match(/^\s*\* \[(.*?)\]\((.*?)\)(?:\s+[-—]\s+(.+))?/);
            if (fullMatch) {
                title = fullMatch[1].trim();
                const newSiteUrl = fullMatch[2].trim();
                // Only update siteUrl if we have a non-empty one
                siteUrl = newSiteUrl || siteUrl;
                content = fullMatch[3] ? fullMatch[3].trim() : '';
                
                // Store parent info if this is not a sub-bullet
                if (!isSubBullet) {
                    lastParentTitle = title;
                    lastParentUrl = siteUrl;
                } else {
                    // For sub-bullets, prepend parent title
                    title = `${lastParentTitle} - ${title}`;
                }
            } else {
                // Handle plain text bullets
                title = line.replace(/^\s*\* /, '').trim();
                
                // For sub-bullets, append to parent title and use parent URL
                if (isSubBullet) {
                    title = `${lastParentTitle} - ${title}`;
                    siteUrl = lastParentUrl;
                }
            }

            // Skip creating listing if it's just a parent with no content
            if (!isSubBullet && !content && line.match(/^\* \[(.*?)\]\((.*?)\)$/)) {
                continue;
            }

            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

                
            // Create a listing object with minimal required fields
            const listing = {
                title: title,
                slug: slug,
                imageUrl: `https://placehold.co/400x300?text=${encodeURIComponent(title)}`,
                siteUrl: siteUrl,
                content: content,
                category: currentCategory,
                categorySlug: currentCategorySlug,
                publishDate: new Date().toISOString().split('T')[0],
                seoKeywords: [title, currentCategory],
                details: [
                    { label: "Version", value: "Latest" },
                    { label: "Type", value: inferType(title, content) },
                    { label: "Category", value: currentCategory },
                    { label: "License", value: inferLicense(content) },
                    { label: "Features", value: inferFeatures(content) },
                    { label: "Website", value: siteUrl }
                ],
                topFeature: false,
                categoryFeature: false
            };
            // don't add empty categories
            if (listing.category.length > 0) {
                const features = detectFeatures(content);
                listing.features = features;
                listings.push(listing);
            }
            
        }
    }

    return listings;
}

function inferType(title, content) {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('sql')) return 'SQL';
    if (text.includes('nosql')) return 'NoSQL';
    if (text.includes('graph')) return 'Graph Database';
    if (text.includes('key-value')) return 'Key-value Store';
    if (text.includes('document')) return 'Document Store';
    return 'Database'; // default
}

function inferLicense(content) {
    const text = content.toLowerCase();
    if (text.includes('mit')) return 'MIT';
    if (text.includes('apache')) return 'Apache 2.0';
    if (text.includes('bsd')) return 'BSD';
    if (text.includes('gpl')) return 'GPL';
    if (text.includes('free') && text.includes('open')) return 'Open Source';
    if (text.includes('commercial') || text.includes('paid')) return 'Commercial';
    return 'Commercial'; // default
}

function inferFeatures(content) {
    let features = [];
    const text = content.toLowerCase();
    features = detectFeatures(text);
    
    return features.length ? features.join(', ') : 'Unknown';
}

const featureDetection = {
    // Backend Features
    'Backend': {
        keywords: ['backend', 'server', 'api'],
        subFeatures: {
            'Database': ['database', 'sql', 'nosql', 'mongodb', 'postgresql'],
            'Serverless': ['serverless', 'faas', 'lambda'],
            'API': ['rest', 'graphql', 'api gateway'],
            'Real-time': ['real-time', 'realtime', 'websocket', 'socket.io']
        }
    },
    // DevOps Features
    'DevOps': {
        keywords: ['devops', 'ci/cd', 'pipeline'],
        subFeatures: {
            'Hosting': ['hosting', 'deploy', 'container'],
            'Monitoring': ['monitor', 'logging', 'analytics', 'apm'],
            'Security': ['security', 'auth', 'authentication', 'encryption'],
            'Scaling': ['scale', 'load balancer', 'auto-scale']
        }
    },
    // Storage Features
    'Storage': {
        keywords: ['storage', 'cdn', 'file'],
        subFeatures: {
            'CDN': ['cdn', 'content delivery'],
            'Object Storage': ['object storage', 's3', 'blob'],
            'Backup': ['backup', 'snapshot', 'redundancy']
        }
    }
};

function detectFeatures(text) {
    const detectedFeatures = new Set();
    const textLower = text.toLowerCase();

    for (const [category, config] of Object.entries(featureDetection)) {
        // Check main category keywords
        if (config.keywords.some(keyword => textLower.includes(keyword))) {
            detectedFeatures.add(category);
        }

        // Check subfeatures
        for (const [subFeature, keywords] of Object.entries(config.subFeatures)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                detectedFeatures.add(subFeature);
            }
        }
    }

    return Array.from(detectedFeatures);
}

// Check if input file is provided as command line argument
if (process.argv.length < 3) {
    console.error('Please provide an input markdown file path');
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'output.json';

// Read markdown file
fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        process.exit(1);
    }

    const listings = parseMarkdownToListings(data);
    
    // Write to JSON file
    fs.writeFile(outputFile, JSON.stringify(listings, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            process.exit(1);
        }
        console.log(`JSON file has been saved to ${outputFile}`);
    });
});
