const express = require('express'); // Express framework for handling routes and serving static files
const fs = require('fs'); // File system module for reading and writing files
const bodyParser = require('body-parser'); // Middleware for parsing JSON and URL-encoded bodies
const confRoute = require('./routes/config.route'); // Custom route for handling routes starting with '/'

/**
 * Express application for serving static files and handling routes.
 * @module index
 */

/**
 * Required modules for the application.
 */

/**
 * Create an instance of the Express application.
 */
const app = express();

/**
 * The port number that the server will listen on.
 */
const port = 4550;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Use the 'confRoute' for handling routes starting with '/'
app.use('/', confRoute);

// Set the directory for views
app.set('views', './views');

// Set the view engine to use EJS
app.set('view engine', 'ejs');

/**
 * Start the server and listen on the specified port.
 * @function
 * @name listen
 * @param {number} port - The port number to listen on.
 * @returns {void}
 */
app.listen(port, () => {
    console.info(`App listening on port ${port}`);
});
