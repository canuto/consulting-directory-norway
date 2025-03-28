/*
* Codehooks (c) example
* A directory web site with dynamic content
*/
import {app, Datastore, aggregation} from 'codehooks-js'
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';
import about from './web/templates/about.hbs';
import contact from './web/templates/contact.hbs';
import account from './web/templates/account.hbs';
import index from './web/templates/index.hbs';
import all from './web/templates/all.hbs';
import category from './web/templates/category.hbs';
import listing from './web/templates/listing.hbs';  
import layout from './web/templates/layout.hbs';
import { 
    loadDirectoriesCached, 
    loadTopFeaturesCached, 
    loadAllCategoriesCached, 
    loadCategoryFeaturesCached,
    loadListingByIdCached,
    writeSitemapToResponse
} from './helpers.js';

const templates = {
    about: handlebars.compile(about),
    contact: handlebars.compile(contact),
    account: handlebars.compile(account),
    index: handlebars.compile(index),
    all: handlebars.compile(all),
    category: handlebars.compile(category),
    listing: handlebars.compile(listing),
    layout: handlebars.compile(layout)
}

const renderPage = async (page, data) => {
    /*const db = await Datastore.open();
    const cache = await db.get(`pagecache-${page}`);
    if (cache) {
        console.log(`Cache hit for ${page}`);
        return cache;
    }*/
    const content = templates[page](data);
    //await db.set(`pagecache-${page}`, content, {ttl: 1000*60*60});
    return content;
}

// Setting up the page views and layout template
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('layout', layout);

// Register the equals Handlebarshelper
handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});


app.auth(/^\/(index|category|account|contact|about\/.*)?$/, (req, res, next) => next());

const rand = () => Math.random();

// Defining routes and page template to render for different pages
app.get('/', async (req, res) => {
    const directories = await loadDirectoriesCached();
    const topFeatures = await loadTopFeaturesCached();
    res.send(await renderPage('index', {directories, topFeatures}));
});

// Generate sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
    await writeSitemapToResponse(res, req.headers.host);
});

// load contact
app.get('/contact', async (req, res) => {
    console.log('contact');
    const directories = await loadDirectoriesCached();
    res.send(await renderPage('contact', {directories}));
});

// load about
app.get('/about', async (req, res) => {
    console.log('about');
    const directories = await loadDirectoriesCached();
    res.send(await renderPage('about', {directories}));
});

// load all categories
app.get('/all', async (req, res) => {
    const directories = await loadDirectoriesCached();
    const allCategories = await loadAllCategoriesCached();
    res.send(await renderPage('all', {directories, allCategories}));
});

// load category by slug
app.get('/:slug', async (req, res) => {
    const {slug} = req.params;
    const directories = await loadDirectoriesCached();
    const categoryFeatures = await loadCategoryFeaturesCached(slug);    
    res.send(await renderPage('category', {directories, categoryFeatures, category: slug}));
});

// load listing by slug and id
app.get('/:categorySlug/:slug/:id', async (req, res) => {
    const {categorySlug, slug, id} = req.params;
    const directories = await loadDirectoriesCached();
    const listing = await loadListingByIdCached(id);
    res.send(await renderPage('listing', {listing, directories, keywords: listing.seoKeywords}));
});

// load account
app.get('/account', async (req, res) => {
    console.log('account');
    const directories = await loadDirectoriesCached();
    res.send(await renderPage('account', {directories}));
});



// load static files (client cache)
app.static({route: "/", directory: "/web", notFound: "/404.html"}/*, (_, res, next) => {
    console.log('If you see this, the client cache is invalidated or called for the first time');
    const ONE_HOUR =  1000*60*60;
    res.set('Cache-Control', `public, max-age=3600, s-maxage=3600`);
    res.setHeader("Expires", new Date(Date.now() + ONE_HOUR).toUTCString());
    //res.set('Vary', '*');
    res.removeHeader('Pragma');
    next();
  }*/)

// bind to serverless runtime
export default app.init();