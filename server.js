/*
* Codehooks (c) example
* A simple web site
*/
import {app, Datastore} from 'codehooks-js'
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';

// Setting up the page views and layout template
handlebars.registerHelper(layouts(handlebars));

app.set('views', '/web/templates');
app.set('layout', '/web/templates/layout.hbs');
app.set('view engine', {"hbs": handlebars});

app.auth(/^\/(index|category|account|contact|about\/.*)?$/, (req, res, next) => { next() });

const rand = () => Math.random();

// Helper function to filter data based on category
const filterByCategory = (items, category) => {
    return items.filter(item => item.category === category);
};

// Add new helper function to filter featured items
const loadTopFeatures = async () => {
    const db = await Datastore.open();  
    const cursor = db.getMany('listings', 
        {
            topFeature: true
        }
    );
    return cursor.toArray();
};
// Add new helper function to filter category features
const loadCategoryFeatures = async (categorySlug) => {
    const db = await Datastore.open();
    const cursor = db.getMany('listings', 
        {
            categoryFeature: true,
            categorySlug: categorySlug
        }
    );
    return cursor.toArray();
};

// load listing by id
const loadListingById = async (id) => {
    const db = await Datastore.open();
    const listing = await db.getOne('listings', {_id: id});
    console.log('listing', listing);
    return listing;
};

const loadDirectories = async () => {
    const db = await Datastore.open();
    const cursor = db.getMany('listings', 
        {
            /* all items */
        }, 
        {
            hints: {
                $fields: {directory: 1, category: 1, categorySlug: 1}
            }
        }
    );
    const directories = {};
    await cursor.forEach((item) => {
        if (!directories[item.directory]) {
            directories[item.directory] = {name: item.directory, count: 0, categorySlug: item.categorySlug};
        }
        directories[item.directory].name = item.directory;
        directories[item.directory].count++;
    })
    return Object.values(directories).sort((a, b) => b.count - a.count);
};

// Defining routes and page template to render for different pages
app.get('/', async (req, res) => {
    const directories = await loadDirectories();
    const topFeatures = await loadTopFeatures();
    console.log('directories', directories, 'topFeatures', topFeatures);
    res.render('index', {directories, topFeatures, rand: rand()});
});

app.get('/category/:slug', async (req, res) => {
    const {slug} = req.params;
    const directories = await loadDirectories();
    const categoryFeatures = await loadCategoryFeatures(slug);
    
    res.render('category', {
        directories,
        categoryFeatures,
        category: slug,
        rand: rand()
    });
});

app.get('/listing/:slug/:id', async (req, res) => {
    const {slug, id} = req.params;
    const directories = await loadDirectories();
    const listing = await loadListingById(id);
    res.render('listing', {listing, directories, rand: rand()});
});

app.get('/account', async (req, res) => {
    console.log('account');
    const directories = await loadDirectories();
    res.render('account', {directories, rand: rand()});
});

app.get('/contact', async (req, res) => {
    console.log('contact');
    const directories = await loadDirectories();
    res.render('contact', {directories, rand: rand()});
});

app.get('/about', async (req, res) => {
    console.log('about');
    const directories = await loadDirectories();
    res.render('about', {directories, rand: rand()});
});

app.static({route: "/", directory: "/web", notFound: "/404.html"} /*,(req, res, next) => {
    console.log('If you see this, the client cache is invalidated or called for the first time');
    const ONE_HOUR =  1000*60*60;
    res.set('Cache-Control', `public, max-age=${ONE_HOUR}, s-maxage=${ONE_HOUR}`);
    res.setHeader("Expires", new Date(Date.now() + ONE_HOUR).toUTCString());
    res.removeHeader('Pragma');
    next();
  }*/)

// bind to serverless runtime
export default app.init();