const Recognizer =  require('../framework/recognizers/Recognizer').Recognizer;
const math = require('mathjs');
const Spline = require('cubic-spline');
const { performance } = require('perf_hooks');


class Point {
	constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}


let NumPoints = 8;
let pathName;
name = "ThreeCentsRecognizer";

class ThreeCentsRecognizer extends Recognizer {

  
    
    constructor(Parameters, dataset) {
		super();
        NumPoints = Parameters.numPoints;
       // pathName = options.pathName;

        this.templates = {};
        this.threshold = Infinity;
    }


    recognize(sample, Artic_Names) {
		let articulations = convert(sample, Artic_Names);
		let t0 = performance.now();
        //----------------------------------------------------------------------------------------------------
        var candidate  = normalizeP(articulations, NumPoints);
		let tPreprocess = performance.now();
        let bestFitClass = "";

        //Soit Enlever le calcul du histogram soit prendre en compte le Threshold
        //let minDist = this.threshold;
        let minDist = Infinity;

        // Compare gesture w/ each template
        Object.keys(this.templates).forEach((name) => {
            for (let i = 0; i < this.templates[name].length; i++) {
                if (candidate.length ==this.templates[name][i].length) {
                let tmpDist = gestureDistance(candidate, this.templates[name][i]);

                if (tmpDist < minDist) {
                    minDist = tmpDist;
                    bestFitClass = name;
                }
            }
         }
        }); 
        
        //----------------------------------------------------------------------------------------------------
		let t1 = performance.now();
		return (bestFitClass == -1) ? { 'Name': 'No match', 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess} : { 'Name': bestFitClass, 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess /**, 'Score': b > 1.0 ? 1.0 / b : 1.0 */};
	}
    

    addGesture(name, sample,ArticulationsNames) {
        let articulations = convert(sample,ArticulationsNames);
        //----------------------------------------------------------------------------------------------------
        articulations = normalizeP(articulations, NumPoints);

        if (!this.templates.hasOwnProperty(name)) {
            this.templates[name] = [];
        }
        this.templates[name].push(articulations);

        //console.log(this.templates[name]);
      
	}
}

function convert(sample, Artic_Names) {
    let articulations = [];
    if (sample.hands != undefined && sample.hands == 2) {
		//Code for unistroke gestures mutlipath
		for (let i = 0; i < Artic_Names.length; i++) {
			articulations[i] = [];
			articulations[Artic_Names.length + i] = [];
			sample.paths[Artic_Names[i]].strokes.forEach((point, stroke_id) => {
				articulations[i].push(new Point(point.x, point.y, point.z, point.stroke_id));
			});
			sample.paths["Left_" + Artic_Names[i]].strokes.forEach((point, stroke_id) => {
				articulations[Artic_Names.length + i].push(new Point(point.x, point.y, point.z, point.stroke_id));
			});

			//For FreeHandDS dataset
		/*	sample.paths[Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
				stroke.points.forEach((point) => {
					articulations[i].push(new Point(point.x, point.y, point.z, stroke_id));
				});
			});
			sample.paths["Left_" + Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
				stroke.points.forEach((point) => {
					articulations[Artic_Names.length + i].push(new Point(point.x, point.y, point.z, stroke_id));
				});
			});*/
		}
	}
	else {
		//Code for unistroke gestures mutlipath
		for (let i = 0; i < Artic_Names.length; i++) {
			articulations[i] = [];
			sample.paths[Artic_Names[i]].strokes.forEach((point, stroke_id) => {
				articulations[i].push(new Point(point.x, point.y, point.z, point.stroke_id));
			});
			/*sample.paths[Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
				stroke.points.forEach((point) => {
					articulations[i].push(new Point(point.x, point.y, point.z, stroke_id));
				});
			});*/
		}
	}

	////Code for Multistroke gestures mutlipath
	/* sample.paths["Palm"].strokes.forEach((stroke, stroke_id) => {
		stroke.points.forEach((point) => {
			points.push(new Point(point.x, point.y, point.z, stroke_id));
	});
	 });*/
	return articulations;
}


function gestureDistance(articulationsA, articulationsB) {
    let dq = 0;
	for (let a = 0; a < articulationsA.length; a += 1) {
		for (let i = 0; i < articulationsA[a].length; i += 1) {    
        var dx = articulationsA[a][i].x - articulationsB[a][i].x;
        var dy = articulationsA[a][i].y - articulationsB[a][i].y;
        var dz = articulationsA[a][i].z - articulationsB[a][i].z;
        dq += dx * dx + dy * dy + dz * dz;
    }
}
    
    return dq;
}

//------------------------------------------

function normalizeP(articulations, n) {

    let resampledArticulations = [];
    let arts = [];
    for (let a = 0; a < articulations.length; a += 1) {
		resampledArticulations[a] = [];
		// avoid modifying the original array (cfr call to splice method below)
		arts[a] = articulations[a].slice(0, articulations[a].length);
    }
    
    let dist = [];
	for (let a = 0; a < articulations.length; a += 1) {
		dist[a] = [0];
    }
    /*
    for (let i = 1; i < points.length; i++) {
        dx = points[i].x - points[i-1].x;
        dy = points[i].y - points[i-1].y;
        dz = points[i].z - points[i-1].z;
        dist.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
    }*/

    for (let a = 0; a < articulations.length; a += 1) {
		for (var i = 1; i < arts[a].length; i++) {
		let dx =arts[a][i].x - arts[a][i - 1].x;
		let dy =arts[a][i].y - arts[a][i - 1].y;
        let dz =arts[a][i].z - arts[a][i - 1].z;
        dist[a].push(Math.sqrt(dx * dx + dy * dy + dz * dz));		
		}		
    }

    var s=[];
    var len=  [];
    let h=[];
    let xq=[];
    for (let a = 0; a < articulations.length; a += 1) {
     s[a] = cumsum(dist[a]);
     len[a]= s[a][s[a].length - 1];

    // Resample
     h[a] = (arts[a].length-1) / (n - 1);
    xq[a] = math.range(0, arts[a].length - 1, h[a])._data;
    xq[a].push(arts[a].length - 1);
    }

    let x = [];
    let xAxis = [];
    let yAxis = [];
    let zAxis = [];
    let sX = [];
    let sY = [];
    let sZ = [];
    let avgX = [];
    let avgY = [];
    let avgZ = [];
    for (let a = 0; a < articulations.length; a += 1) {
     x[a] = [];
     xAxis[a] = [];
     yAxis[a] = [];
     zAxis[a] = [];
     sX[a] = [];
     sY[a] = [];
     sZ[a] = [];
     avgX[a] = [];
     avgY[a] = [];
     avgZ[a] = [];
    }
    
for (let a = 0; a < articulations.length; a += 1) {
    for (let i = 0; i < arts[a].length; i++) {
        x[a].push(i);
        xAxis[a].push( arts[a][i].x);
        yAxis[a].push( arts[a][i].y);
        zAxis[a].push( arts[a][i].z);
    }

     sX[a] = spline(x[a], xAxis[a], xq[a]);
     sY[a]= spline(x[a], yAxis[a], xq[a]);
     sZ[a]= spline(x[a], zAxis[a], xq[a]);

     avgX[a] = sX[a].reduce((c,b) => c + b, 0) / sX[a].length;
     avgY[a] = sY[a].reduce((c,b) => c + b, 0) / sY[a].length;
     avgZ[a] = sZ[a].reduce((c,b) => c + b, 0) / sZ[a].length;

    
    for (let i = 0; i < xq[a].length; i++) {
        // Center (wrt. centroid) and scale
        resampledArticulations[a].push(new Point((sX[a][i] - avgX[a]) / len[a], (sY[a][i] - avgY[a]) / len[a], (sZ[a][i] - avgZ[a]) / len[a]));
     }
    }
    return resampledArticulations;
}

function cumsum(data) {
    var acc = 0;
    return math.map(data, function(x) {
        acc += x;
        return acc;
    })
}

// cubic interpolation of x and y.
// xq: query points
function spline(x, y, xq) {
    const spline = new Spline(x, y);
    var s = new Array(xq.length);
    for (let i = 0; i < xq.length; i++) {
        s[i] = spline.at(xq[i]);
    }
    return s;
}


module.exports = {
	ThreeCentsRecognizer
};