const Recognizer = require('../framework/recognizers/Recognizer').Recognizer;

const { performance } = require('perf_hooks');

/**
 *  Implementation of Penny Pincher in Javascript:
 *		Nathan Magrofuoco
 *		Université catholique de Louvain
 *		Louvain-la-Neuve, Belgium
 *		nathan.magrofuoco@uclouvain.be
 *
 *	Untested 3D Version
 */

// Point class constructor
class PennyPincher3D_Point {
	constructor(x, y, z, id) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.id = id;
	}
}

// Gesture class constructor
class PennyPincher3D_Gesture {
	constructor(gestureName, articulations) {
		this.name = gestureName;
		this.Articulations = resampleBetweenPoints(articulations);
	}
}

const name = "PennyPincher3DRecognizer";
let numberOfPoints;
let numberOfArticulations ;
class PennyPincher3D extends Recognizer {

	constructor(Parameters, dataset) {
		super();
		numberOfPoints = Parameters.numPoints;
		numberOfArticulations = Parameters.articulationName.length;
		this.templates = new Array();
	}

	addGesture(name, sample, ArticulationsNames) {
		let articulations = convert(sample, ArticulationsNames);
		this.templates.push(new PennyPincher3D_Gesture(name, articulations));
		var num = 0;
		for (var i = 0; i < this.templates.length; i++) {
			if (this.templates[i].Name == name)
				num++;
		}
		return num;
	}

	recognize(sample, Artic_Names) {
		


		let articulations = convert(sample, Artic_Names);
		let t0 = performance.now();
		const candidate = new PennyPincher3D_Gesture("", articulations);
		let tPreprocess = performance.now();
		let maxSimilarity = -Infinity;
		let bestTemplate = -1;
		// match the candidate with each stored template
		for (let t = 0; t < this.templates.length; t += 1) {
			if (candidate.Articulations.length == this.templates[t].Articulations.length) {
				const similarity = matching(candidate.Articulations, this.templates[t].Articulations);
				if (similarity > maxSimilarity) {
					maxSimilarity = similarity;
					bestTemplate = t;
				}
			}
		}
		let t1 = performance.now(); // stop timer
		return (bestTemplate == -1) ? { 'Name': 'No match', 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess} : { 'Name': this.templates[bestTemplate].name, 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess};
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
				articulations[i].push(new PennyPincher3D_Point(point.x, point.y, point.z, point.stroke_id));
			});
			sample.paths["Left_" + Artic_Names[i]].strokes.forEach((point, stroke_id) => {
				articulations[Artic_Names.length + i].push(new PennyPincher3D_Point(point.x, point.y, point.z, point.stroke_id));
			});

			//For FreeHandDS dataset
			/*sample.paths[Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
				stroke.points.forEach((point) => {
					articulations[i].push(new PennyPincher3D_Point(point.x, point.y, point.z, stroke_id));
				});
			});
			sample.paths["Left_" + Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
				stroke.points.forEach((point) => {
					articulations[Artic_Names.length + i].push(new PennyPincher3D_Point(point.x, point.y, point.z, stroke_id));
				});
			});*/
		}
	}
	else {
		//Code for unistroke gestures mutlipath
		for (let i = 0; i < Artic_Names.length; i++) {
			articulations[i] = [];
			sample.paths[Artic_Names[i]].strokes.forEach((point, stroke_id) => {
				articulations[i].push(new PennyPincher3D_Point(point.x, point.y, point.z, point.stroke_id));
			});
				/*sample.paths[Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
					stroke.points.forEach((point) => {
						articulations[i].push(new PennyPincher3D_Point(point.x, point.y, point.z, stroke_id));
					});
				});*/
		}
	}
	return articulations;
}

function resampleBetweenPoints(articulations) {
	let arts = [];
	let vectors = [];
	for (let a = 0; a < numberOfArticulations; a += 1) {
		vectors[a] = [];
		// avoid modifying the original array (cfr call to splice method below)
		arts[a] = articulations[a].slice(0, articulations[a].length);
	}

	// the interval between two resampled points depends of the number of shapes
	// and the total length of each articulation's points
	let intervals = [];
	for (let a = 0; a < numberOfArticulations; a += 1) {
		intervals[a] = pathLength(articulations[a]) / (numberOfPoints - 1);
	}
	// resample the articulation's point when it is too far away from the previous
	let dist = [];
	for (let a = 0; a < numberOfArticulations; a += 1) {
		dist[a] = 0.0;
	}
	for (let a = 0; a < numberOfArticulations; a += 1) {
		let prev = articulations[a][0];
		const origin = new PennyPincher3D_Point(0, 0, 0);
		for (let i = 1; i < arts[a].length; i += 1) {
			const dist2 = euclideanDistance(arts[a][i - 1], arts[a][i]);
			if ((dist[a] + dist2) >= intervals[a]) {
				const qX = arts[a][i - 1].x + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].x - arts[a][i - 1].x);
				const qY = arts[a][i - 1].y + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].y - arts[a][i - 1].y);
				const qZ = arts[a][i - 1].z + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].z - arts[a][i - 1].z);
				const q = new PennyPincher3D_Point(qX, qY, qZ);
				let r = new PennyPincher3D_Point(q.x - prev.x, q.y - prev.y, q.z - prev.z);
				const dist3 = euclideanDistance(r, origin);
				r = new PennyPincher3D_Point(r.x / dist3, r.y / dist3, r.z / dist3);
				vectors[a].push(r);
				arts[a].splice(i, 0, q);
				dist[a] = 0.0;
				prev = q;
			}
			else dist[a] += dist2;
		}
	}
	// sometimes we fall a rounding-error short of adding the last point, so add it if so
	for (let a = 0; a < numberOfArticulations; a += 1) {
		if (vectors[a].length == numberOfPoints - 2) {
			vectors[a].push(
				new PennyPincher3D_Point(
					vectors[a][vectors[a].length - 1].x,
					vectors[a][vectors[a].length - 1].y,
					vectors[a][vectors[a].length - 1].z
				)
			);
		} else {
			if (vectors[a].length < numberOfPoints - 2) {
				while (vectors[a].length < numberOfPoints-1) {
					vectors[a].push(
						new PennyPincher3D_Point(
							vectors[a][vectors[a].length - 1].x,
							vectors[a][vectors[a].length - 1].y,
							vectors[a][vectors[a].length - 1].z
						)
					);
				}
			}
		}

	}
	return vectors;
}

function pathLength(points) {
	let d = 0.0;
	for (let i = 1; i < points.length; i += 1)
		d += euclideanDistance(points[i - 1], points[i]);
	return d;
}

function euclideanDistance(p1, p2) {
	const dX = p2.x - p1.x;
	const dY = p2.y - p1.y;
	const dZ = p2.z - p1.z;
	return Math.sqrt(dX * dX + dY * dY + dZ * dZ);
}

function matching(articulationsA, articulationsB) {
	let similarity = 0;
	//Calculate the similarity of vectors on the same articulation of the gestures
	for (let b = 0; b < numberOfArticulations; b += 1) {
		for (let i = 0; i < articulationsA[b].length; i += 1) {
			similarity +=
				articulationsA[b][i].x * articulationsB[b][i].x +
				articulationsA[b][i].y * articulationsB[b][i].y +
				articulationsA[b][i].z * articulationsB[b][i].z;
		}
	}
	return similarity;
}

module.exports = {
	PennyPincher3D
}
