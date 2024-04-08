const path = require('path'); // Importing the 'path' module to work with file paths
const fs = require('fs'); // Importing the 'fs' module to work with the file system
const GestureSet = require('../framework/gestures/GestureSet').GestureSet; // Importing the GestureSet class from a the module
const GestureClass = require('../framework/gestures/GestureClass').GestureClass; // Importing classes from the '../framework/gestures' module

// Function to load a dataset given a name and directory for the UD Scenario for a folder tree structure (User->GestureSamples) 
function loadDataset(name, directory) {
    const gestureSet = {}; // Creating an empty object to store the gesture dataset
    const dirPath = path.join(__dirname, directory); // Constructing the directory path based on the current file's directory and the provided directory name

    fs.readdirSync(dirPath).forEach((user) => { // Reading the contents of the directory synchronously and iterating over each user
        let gestureIndex = 0; // Initializing the gesture index for each user
        const userDirPath = path.join(dirPath, user); // Constructing the user directory path based on the parent directory path and the current user

        fs.readdirSync(userDirPath).forEach((Repet) => { // Reading the contents of the user directory synchronously and iterating over each repetition
            const rawGesturePath = path.join(userDirPath, Repet); // Constructing the path to the raw gesture data file based on the user directory path and the current repetition
            const strokeData = JSON.parse(fs.readFileSync(rawGesturePath)); // Reading and parsing the raw gesture data file as JSON

            Repet = Repet.split(".")[0].split("-"); // Extracting the gesture name from the repetition filename
            const gestureName = Repet[0].split("#")[0]; // Extracting the gesture name from the repetition filename

            if (gestureSet[user]) { // Checking if the gesture set for the current user already exists
                if (gestureSet[user].getGestureClass().has(gestureName)) { // Checking if the gesture class for the current gesture name already exists
                    gestureSet[user].getGestureClass().get(gestureName).addSample(strokeData); // Adding the stroke data as a sample to the existing gesture class
                } else {
                    const gestureClass = new GestureClass(gestureName, gestureIndex++); // Creating a new gesture class with the gesture name and incrementing the gesture index
                    gestureClass.addSample(strokeData); // Adding the stroke data as a sample to the new gesture class
                    gestureSet[user].addGestureClass(gestureClass); // Adding the new gesture class to the existing gesture set
                }
            } else {
                const newGestureSet = new GestureSet(user); // Creating a new gesture set for the current user
                gestureSet[user] = newGestureSet; // Adding the new gesture set to the gesture set object

                if (gestureSet[user].getGestureClass().has(gestureName)) { // Checking if the gesture class for the current gesture name already exists
                    gestureSet[user].getGestureClass().get(gestureName).addSample(strokeData); // Adding the stroke data as a sample to the existing gesture class
                } else {
                    const gestureClass = new GestureClass(gestureName, gestureIndex++); // Creating a new gesture class with the gesture name and incrementing the gesture index
                    gestureClass.addSample(strokeData); // Adding the stroke data as a sample to the new gesture class
                    gestureSet[user].addGestureClass(gestureClass); // Adding the new gesture class to the existing gesture set
                }
            }
        });
    });

    return gestureSet; // Returning the populated gesture set
}

module.exports = {
    loadDataset // Exporting the loadDataset function as a module
};
