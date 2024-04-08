class GestureSet {
    constructor(name) {
        this.name = name; // Represents the name of the gesture set
        this.gestures = new Map(); // Holds the gesture classes in a map
        this.G = 0; // Represents the total number of gesture classes
        this.Nb_user = 0; // Represents the number of users
    }

    addUserNumber(number) {
        this.Nb_user = number; // Sets the number of users for the gesture set
    }

    addGestureClass(gestureClass) {
        this.gestures.set(gestureClass.name, gestureClass); // Adds a gesture class to the set
        this.G += 1; // Increments the total number of gesture classes
    }

    getGestureClass() {
        return this.gestures; // Returns the map of gesture classes
    }

    getMinTemplate() {
        let TperG = Infinity; // Represents the minimum number of templates per gesture class

        for (const gestureClass of this.gestures.values()) {
            TperG = Math.min(TperG, gestureClass.TperG); // Updates the minimum number of templates per gesture class
        }

        return TperG; // Returns the minimum number of templates per gesture class
    }

    getMinTemplatePerUser(participants) {
        let TperPG = Infinity; // Represents the minimum number of templates per participant per gesture class

        for (const gestureClass of this.gestures.values()) {
            for (const participant of participants) {
                const count = gestureClass.samples.filter((sample) => sample.subject === participant).length; // Counts the number of samples for a participant in a gesture class
                TperPG = Math.min(TperPG, count); // Updates the minimum number of templates per participant per gesture class
            }
        }

        return TperPG; // Returns the minimum number of templates per participant per gesture class
    }

    getMinUser() {
        return this.Nb_user; // Returns the number of users for the gesture set
    }
}

module.exports = {
    GestureSet // Exports the GestureSet class
};
