const lunr = require('lunr'),
    fs = require('fs');

// Read and parse the JSON file
const documents = JSON.parse(fs.readFileSync('bin/database-listings.json', 'utf8'))
const showHitsData = {}

const idx = lunr(function () {
     
    this.ref('_id')
    this.field('title')
    this.field('content')
    this.field('category')
    this.field('siteUrl')
    // smart url's
    this.field('urlTokens', {
        extractor: doc => {
            const url = doc.siteUrl || '';
            // Remove common prefixes and suffixes
            const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
            // Split by dots and dashes
            const parts = cleanUrl.split(/[.-]/);
            // Return all parts plus the original cleaned URL
            return [...parts, cleanUrl].join(' ');
        }
    })
    
    this.field('details', {
        extractor: doc => doc.details?.map(detail => `${detail.label} ${detail.value}`).join(' ')
    })

    

    documents.forEach(function (doc) {        
        this.add(doc)
        showHitsData[doc._id] = {
            title: doc.title,
            siteUrl: doc.siteUrl,
            content: doc.content,
            category: doc.category,
            slug: doc.slug            
        }
    }, this)
})

const serialized = JSON.stringify(idx)
fs.writeFileSync('web/js/lunr-index.json', serialized)
fs.writeFileSync('web/js/show-hits-data.json', JSON.stringify(showHitsData))