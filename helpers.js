import { Datastore } from 'codehooks-js'

const ONE_HOUR = 1000*60*60;

// Cache helper
async function getCached(key, loader, ttl = ONE_HOUR) {
    const db = await Datastore.open();
    const cached = await db.get(`cache-${key}`);
    
    if (cached) {
        console.log(`Cache hit for db ${key}`);
        return JSON.parse(cached);
    }

    const data = await loader();
    await db.set(`cache-${key}`, JSON.stringify(data), {ttl: ttl});
    return data;
}

// Data loaders
async function loadTopFeatures() {
    const db = await Datastore.open();  
    return db.getMany('listings', { topFeature: true }).toArray();
}

async function loadCategoryFeatures(categorySlug) {
    const db = await Datastore.open();
    return db.getMany('listings', { categorySlug }).toArray();
}

async function loadListingById(id) {
    const db = await Datastore.open();
    return db.getOne('listings', {_id: id});
}

async function loadDirectories() {
    const db = await Datastore.open();
    const cursor = db.getMany('listings', {}, {
        hints: { $fields: {directory: 1, category: 1, categorySlug: 1} }
    });
    
    const directories = {};
    let totalCount = 0;
    
    await cursor.forEach((item) => {
        if (!directories[item.categorySlug]) {
            directories[item.categorySlug] = {name: item.category, count: 0, categorySlug: item.categorySlug};
        }
        directories[item.categorySlug].name = item.category;
        directories[item.categorySlug].count++;
        totalCount++;
    });
    
    directories['all'] = {name: 'All categories', count: totalCount, categorySlug: 'all'};
    
    return Object.values(directories).sort((a, b) => {
        if (a.categorySlug === 'all') return -1;
        if (b.categorySlug === 'all') return 1;
        return a.name.localeCompare(b.name);
    });
}

async function loadAllCategories() {
    const db = await Datastore.open();    
    const result = await db.getMany('listings', {}).toArray();
    return result.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
}

// Cached versions
const loadDirectoriesCached = () => getCached('directories', loadDirectories);
const loadTopFeaturesCached = () => getCached('topFeatures', loadTopFeatures);
const loadAllCategoriesCached = () => getCached('allCategories', loadAllCategories);
const loadCategoryFeaturesCached = (slug) => getCached(`categoryFeatures-${slug}`, () => loadCategoryFeatures(slug));
const loadListingByIdCached = (id) => getCached(`listing-${id}`, () => loadListingById(id));

// Generate sitemap XML directly to response
async function writeSitemapToResponse(res, host) {
    const db = await Datastore.open();
    const sitename = `https://${host}`;
    const listings = db.getMany('listings');
    
    res.setHeader('Content-Type', 'application/xml');
    
    res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
    
    // Add root URL
    res.write(`  <url>
    <loc>${sitename}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`);
    
    // Add all categories page
    res.write(`  <url>
    <loc>${sitename}/category/all</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`);
    
    // Add all directory entries
    await listings.forEach((listing) => {
        res.write(`  <url>
    <loc>${sitename}/${listing.categorySlug}/${listing.slug}/${listing._id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`);
    });
    
    res.write('</urlset>');
    res.end();
}

// Export the new function along with existing exports
export { writeSitemapToResponse, loadDirectoriesCached, loadTopFeaturesCached, loadAllCategoriesCached, loadCategoryFeaturesCached, loadListingByIdCached }; 