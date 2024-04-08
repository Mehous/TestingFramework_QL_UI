// Define the GestureClass class
class GestureClass {
    constructor(name, index) {
        this.name = name;
        this.samples = [];
        this.index = index;
        this.TperG = 0;
    }

    // Add a sample to the gesture
    addSample(data) {
        this.samples.push(data);
        this.TperG++;
    }

    // Get all the samples of the gesture
    getSample() {
        return this.samples;
    }

    // Get the start and end index of samples belonging to a specific participant
    getSampleParticipant(NumParticipant) {
        const samplesReversed = [...this.samples].reverse();
        const startIndex = this.samples.findIndex(gesture => gesture.subject === NumParticipant);
        const endIndex = this.samples.length - samplesReversed.findIndex(gesture => gesture.subject === NumParticipant);
        return [startIndex, endIndex];
    }
}

// Export the GestureClass module
module.exports = {
    GestureClass
};