const path = require('path'); // Importing the 'path' module for working with file paths
const fs = require('fs'); // Importing the 'fs' module for working with the file system
const GestureSet = require('../framework/gestures/GestureSet').GestureSet; // Importing the GestureSet class from a module
const GestureClass = require('../framework/gestures/GestureClass').GestureClass; // Importing the GestureClass class from a module

    // Function to load a dataset for specific folder tree structure in a gesture sets given a name and directory for the UD Scenario (User->GestureClass->GestureSamples)
function loadDataset(name, directory) {
    const gestureSet = {}; // Object to store the gesture data
    const dirPath = path.join(__dirname, directory); // Getting the absolute path of the directory

    // Reading the contents of the directory synchronously and iterating over each user
    fs.readdirSync(dirPath).forEach((user) => { // Looping through each user directory
        let gestureIndex = 0; // Index to assign to each gesture
        const userDirPath = path.join(dirPath, user); // Getting the absolute path of the user directory
        fs.readdirSync(userDirPath).forEach((gesture) => { // Looping through each gesture directory
            const GestDirPath = path.join(userDirPath, gesture); // Getting the absolute path of the gesture directory
            fs.readdirSync(GestDirPath).forEach((Repet) => { // Looping through each repetition directory
                const rawGesturePath = path.join(GestDirPath, Repet); // Getting the absolute path of the repetition file
                const strokeData = JSON.parse(fs.readFileSync(rawGesturePath)); // Reading and parsing the gesture data from the file

                Repet = Repet.split(".")[0].split("-"); // Extracting the gesture name from the repetition file name
                const gestureName = Repet[0].split("#")[0]; // Extracting the gesture name from the repetition file name

                if (gestureSet[user]) { // Checking if the user already exists in the gestureSet object
                    if (gestureSet[user].getGestureClass().has(gestureName)) { // Checking if the gesture class already exists for the user
                        gestureSet[user].getGestureClass().get(gestureName).addSample(strokeData); // Adding the gesture sample to the existing gesture class
                    } else {
                        const gestureClass = new GestureClass(gestureName, gestureIndex++); // Creating a new gesture class
                        gestureClass.addSample(strokeData); // Adding the gesture sample to the gesture class
                        gestureSet[user].addGestureClass(gestureClass); // Adding the gesture class to the user's gesture set
                    }
                } else {
                    const newGestureSet = new GestureSet(user); // Creating a new gesture set for the user
                    gestureSet[user] = newGestureSet; // Adding the gesture set to the gestureSet object
                    if (gestureSet[user].getGestureClass().has(gestureName)) { // Checking if the gesture class already exists for the user
                        gestureSet[user].getGestureClass().get(gestureName).addSample(strokeData); // Adding the gesture sample to the existing gesture class
                    } else {
                        const gestureClass = new GestureClass(gestureName, gestureIndex++); // Creating a new gesture class
                        gestureClass.addSample(strokeData); // Adding the gesture sample to the gesture class
                        gestureSet[user].addGestureClass(gestureClass); // Adding the gesture class to the user's gesture set
                    }
                }
            });
        });
    });

    return gestureSet; // Returning the gestureSet object
}

module.exports = {
    loadDataset // Exporting the loadDataset function
};
