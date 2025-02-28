/*
* Codehooks (c) example
* A simple web site
*/
import {app} from 'codehooks-js'
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';
import { data } from './data.js';

// Setting up the page views and layout template
handlebars.registerHelper(layouts(handlebars));
app.set('views', '/web/templates');
app.set('layout', '/web/templates/layout.hbs');
app.set('view engine', {"hbs": handlebars});

app.auth(/^\/(index|category\/.*)?$/, (req, res, next) => { next() });

// Defining routes and page template to render for different pages
app.get('/', async (req, res) => {
    res.render('index', data);
});

app.get('/category/:slug', async (req, res) => {
    res.render('category', {...data, category: req.params.slug});
});


app.static({route: "/", directory: "/web", notFound: "/404.html"})

// bind to serverless runtime
export default app.init();