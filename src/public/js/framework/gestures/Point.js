// Define a class for a 2D point
class Point2D {
    constructor(x, y, t) {
        this.x = x; // x-coordinate of the point
        this.y = y; // y-coordinate of the point
        this.t = t; // timestamp of the point
    }
}

// Define a class for a 3D point
class Point3D {
    constructor(x, y, z, t) {
        this.x = x; // x-coordinate of the point
        this.y = y; // y-coordinate of the point
        this.z = z; // z-coordinate of the point
        this.t = t; // timestamp of the point
    }
}

// Export the Point2D and Point3D classes
module.exports = {
    Point2D,
    Point3D
};