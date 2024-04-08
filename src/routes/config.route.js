const express = require('express'); // Importing the express module
const { launchTest, loadView } = require('../controller/config.controller.js'); // Importing the launchTest and loadView functions from the config.controller.js file

const router = express.Router(); // Creating a new router object using the express.Router() method

router.post('/', launchTest); // Defining a POST route that calls the launchTest function when accessed
router.get('/', loadView); // Defining a GET route that calls the loadView function when accessed

module.exports = router; // Exporting the router object to be used in other files
