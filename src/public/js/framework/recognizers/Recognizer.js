/**
 * Represents a generic recognizer.
 */
class Recognizer {
    /**
     * Creates a new instance of Recognizer.
     * @param {object} options - The options for the recognizer.
     * @param {object} dataset - The dataset for the recognizer.
     */
    constructor(options, dataset) {
        // Empty constructor
    }

    /**
     * Adds a gesture to the recognizer.
     * @param {string} name - The name of the gesture.
     * @param {object} sample - The sample data for the gesture.
     * @throws {Error} - Throws an error if the function is not implemented.
     */
    addGesture(name, sample) {
        throw new Error('You must implement this function');
    }

    /**
     * Recognizes a sample.
     * @param {object} sample - The sample data to be recognized.
     * @throws {Error} - Throws an error if the function is not implemented.
     */
    recognize(sample) {
        throw new Error('You must implement this function');
    }

    /**
     * Removes a gesture from the recognizer.
     * @param {string} name - The name of the gesture to be removed.
     * @throws {Error} - Throws an error if the function is not implemented.
     */
    removeGesture(name) {
        throw new Error('You have to implement this function');
    }
}

module.exports = {
    Recognizer
};
