const path = require('path'); // Importing the 'path' module to work with file paths
const fs = require('fs'); // Importing the 'fs' module to work with the file system
const GestureSet = require('../framework/gestures/GestureSet').GestureSet; // Importing the GestureSet class from a the module
const GestureClass = require('../framework/gestures/GestureClass').GestureClass; // Importing the GestureClass class from a the module

// Function to load a dataset given a name and directory for the UI Scenario
function loadDataset(name, directory) {
    const gestureSet = new GestureSet(name); // Creating a new instance of GestureSet with the given name
    const dirPath = path.join(__dirname, directory); // Getting the absolute path of the directory
    const User_folders = fs.readdirSync(dirPath); // Getting the list of user folders in the directory and synchronously reading the directory

    gestureSet.addUserNumber(User_folders.length); // Adding the number of user folders to the gestureSet

    User_folders.forEach((user) => { // Looping through each user folder
        const userDirPath = path.join(dirPath, user); // Getting the absolute path of the user folder
        const gestures = fs.readdirSync(userDirPath); // Getting the list of gestures in the user folder and synchronously reading the directory

        gestures.forEach((gesture) => { // Looping through each gesture
            const rawGesturePath = path.join(userDirPath, gesture); // Getting the absolute path of the gesture file
            if (gesture.endsWith('.json')) { // Checking if the gesture file has a .json extension
                const strokeData = JSON.parse(fs.readFileSync(rawGesturePath)); // Reading and parsing the gesture file as JSON

                const gestureName = gesture.split(".")[0].split("-")[0].split("#")[0]; // Extracting the gesture name from the file name
                if (gestureSet.getGestureClass().has(gestureName)) { // Checking if the gestureSet already has a GestureClass with the same name
                    gestureSet.getGestureClass().get(gestureName).addSample(strokeData); // Adding the strokeData to the existing GestureClass
                } else {
                    const gestureClass = new GestureClass(gestureName, gestureSet.getGestureClass().size); // Creating a new GestureClass with the gesture name and the current size of gestureSet's GestureClass
                    gestureClass.addSample(strokeData); // Adding the strokeData to the new GestureClass
                    gestureSet.addGestureClass(gestureClass); // Adding the new GestureClass to the gestureSet
                }
            }
        });
    });

    return gestureSet; // Returning the loaded gestureSet
}

module.exports = {
    loadDataset // Exporting the loadDataset function as a module
};
