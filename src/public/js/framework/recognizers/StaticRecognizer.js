/**
 * Represents an abstract static gesture recognizer.
 * @class
 */
class AbstractStaticRecognizer {
    /**
     * Creates an instance of AbstractStaticRecognizer.
     * @constructor
     * @param {object} options - The options for the recognizer.
     * @param {object} dataset - The dataset for the recognizer.
     */
    constructor(options, dataset) {
        // Empty constructor
    }

    /**
     * Adds a gesture to the recognizer.
     * @param {string} name - The name of the gesture.
     * @param {object} frame - The frame of the gesture.
     * @throws {Error} - You have to implement this function.
     */
    addGesture(name, frame) {
        throw new Error('You have to implement this function');
    }

    /**
     * Removes a gesture from the recognizer.
     * @param {string} name - The name of the gesture to remove.
     * @throws {Error} - You have to implement this function.
     */
    removeGesture(name) {
        throw new Error('You have to implement this function');
    }

    /**
     * Recognizes a gesture from a given frame.
     * @param {object} frame - The frame to recognize the gesture from.
     * @throws {Error} - You have to implement this function.
     */
    recognize(frame) {
        throw new Error('You have to implement this function');
    }
}

module.exports = {
    AbstractStaticRecognizer
};
