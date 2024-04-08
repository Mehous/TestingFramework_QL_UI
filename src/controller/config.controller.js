const ejs = require("ejs"); // Importing the ejs module
const Config = require('../Configuration.js'); // Importing the Config module from the Configuration.js file
const { Start } = require("../benchmark.js"); // Importing the Start function from the benchmark.js file
const Interface = require('../public/json/interfaceval.json'); // Importing the Interface object from the interfaceval.json file

let testVar = ""; // Declaring a variable to store test data
let confVal = Interface; // Assigning the Interface object to the confVal variable

// Function to load the view
const loadView = async (req, res) => {
  res.render('index.ejs', {
    Values: confVal // Passing the confVal variable to the view
  });
};

// Function to launch the test
const launchTest = async (req, res) => {
  testVar = req.body; // Assigning the request body to the testVar variable
  // Checking if recognizer is a string and converting it to an array if necessary
  if (typeof testVar.recognizer === 'string' || testVar.recognizer instanceof String) {
    testVar.recognizer = [testVar.recognizer];
  }
  // Checking if joint is a string and converting it to an array if necessary
  if (typeof testVar.joint === 'string' || testVar.joint instanceof String) {
    testVar.joint = [testVar.joint];
  }
  // Creating a new Config object with the provided test data
  const configuration = new Config(
    testVar.recognizer,
    testVar.dataset,
    parseInt(testVar.scenario),
    testVar.joint,
    parseInt(testVar.rangetemplates),
    parseInt(testVar.rangeindependentparticipants),
    parseInt(testVar.repetitions),
    parseInt(testVar.resamplingpoints)
  );
  console.log(configuration); // Logging the configuration object
  await Start(configuration); // Calling the Start function with the configuration object
  res.render('index', {
    Values: confVal // Passing the confVal variable to the view to reset the view after the test to complete
  });
};

module.exports = {
  launchTest,
  loadView
};
