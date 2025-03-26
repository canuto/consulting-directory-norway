/*
 * Builds a sitemap.xml file
 */

const fs = require('fs');
const path = require('path');

// read the database-listings.json file
const listings = JSON.parse(fs.readFileSync('build/database-listings.json', 'utf8'));

// create a sitemap.xml file
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`; 

// add each listing to the sitemap
listings.forEach(listing => {
  sitemap += `<url>
    <loc>/${listing.categorySlug}/${listing.slug}/${listing._id}</loc>
  </url>
`; 
});

// write the sitemap to the sitemap.xml file
fs.writeFileSync('web/sitemap.xml', sitemap);

console.log('Sitemap built successfully');