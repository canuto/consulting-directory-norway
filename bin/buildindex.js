const lunr = require('lunr'),
    fs = require('fs');

// Read and parse the JSON file
const documents = JSON.parse(fs.readFileSync('bin/database-listings.json', 'utf8'))

const idx = lunr(function () {
     
    this.ref('_id')
    this.field('title')
    this.field('content')
    this.field('category')
    this.field('siteUrl')
    
    
    this.field('details', {
        extractor: doc => doc.details?.map(detail => `${detail.label} ${detail.value}`).join(' ')
    })

    

    documents.forEach(function (doc) {        
        this.add(doc)
    }, this)
})

const serialized = JSON.stringify(idx)
fs.writeFileSync('web/js/lunr-index.json', serialized)