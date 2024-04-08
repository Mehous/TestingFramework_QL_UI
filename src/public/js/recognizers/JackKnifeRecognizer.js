const Recognizer =  require('../framework/recognizers/Recognizer').Recognizer;
const jackknife_blades = require('./jackknife/jackknife').jackknife_blades;
const Jackknife = require('./jackknife/jackknife_recognizer').Jackknife;
const Vector = require('./jackknife/vector').Vector;
const Sample = require('./jackknife/sample').Sample;
const { performance } = require('perf_hooks');

name = "JackknifeRecognizer";

class JackKnifeRecognizer extends Recognizer {



    constructor(options, dataset) {
        super();
         options;
        let blades = new jackknife_blades();
        //Set the values of the different parameters of the recognizer
        blades.set_ip_defaults(options.numPoints);
        this.jackknifeRecognizer = new Jackknife(blades)	
    }
    
    recognize(sample,Artic_Names) {
        let jackknifeSample = convert(sample,null,Artic_Names);
        if (!jackknifeSample) {
            return { 'Name': 'No match', 'Time': 0.0 };
        }
		let t0 = performance.now();
        let ret = this.jackknifeRecognizer.classify(jackknifeSample);
        let t1 = performance.now();
		return (ret == -1) ? { 'Name': 'No match', 'Time': t1 - t0,'PreProcessTime': ret[1]- t0,'ClassificationTime': t1 - ret[1] } : { 'Name': ret[0], 'Time': t1 - t0,'PreProcessTime': ret[1]- t0,'ClassificationTime': t1 - ret[1]};
	}

	addGesture(name, sample, ArticulationsNames,train = false,) {
        let jackknifeSample = convert(sample, name,ArticulationsNames);
        if (jackknifeSample) {
            this.jackknifeRecognizer.add_template(jackknifeSample);
            if (train) {
                this.jackknifeRecognizer.train(6, 2, 1.0);
            }
        }
    }
    
    Train() {  
        
            this.jackknifeRecognizer.train(6, 2, 1.0);          
    }
}

function convert(sample, name,ArticulationsNames) {
    let jackknifeSample;
    if (name) {
        jackknifeSample = new Sample(0, name);
    } else {
        jackknifeSample = new Sample();
    }

    let pathsLabels = ArticulationsNames;
    // check min distance START
    let maxMovement = 0;
    let threshold = 0.0;
    let initPoints = {};
    for (const articulation of pathsLabels) {
        initPoints[articulation] = sample.paths[articulation].strokes[0];
    }
    // check min distance END

    let nFrames = sample.paths[pathsLabels[0]].strokes.length;
    let trajectory = [];
    for (let i = 0; i < nFrames-1; i++) {
        let vCoordinates = [];
        for (const articulation of pathsLabels) {
            if(articulation!=undefined){
            let point = sample.paths[articulation].strokes[i];
            // check min distance START
            let articulationMovement = distance(point, initPoints[articulation]);
            maxMovement = Math.max(maxMovement, articulationMovement);
            // check min distance END
            vCoordinates.push(point.x);
            vCoordinates.push(point.y);
            vCoordinates.push(point.z);
        }
    }
        trajectory.push(new Vector(vCoordinates));
    }
    jackknifeSample.add_trajectory(trajectory);
    
    return maxMovement > threshold ? jackknifeSample : null;
    //return jackknifeSample;
}

function distance(p1, p2) // Euclidean distance between two points
{
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	var dz = p2.z - p1.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

module.exports = {
	JackKnifeRecognizer
};