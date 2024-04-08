// Define the StrokeData class
class StrokeData {
    constructor() {
        this.strokes = [];
    }

    // Add a stroke to the StrokeData
    addStroke = (stroke) => {
        this.strokes.push(stroke);
    };
}

// Define the Stroke class
class Stroke {
    constructor() {
        this.paths = {};
    }

    // Add a path to the Stroke
    addPath = (label, path) => {
        this.paths[label] = path;
    };
}

// Define the Path class
class Path {
    constructor(label) {
        this.label = label;
        this.points = [];
    }

    // Add a point to the Path
    addPoint = (point) => {
        this.points.push(point);
    };
}

module.exports = {
    StrokeData,
    Stroke,
    Path
};
