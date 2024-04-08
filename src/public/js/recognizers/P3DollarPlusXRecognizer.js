const Recognizer = require('../framework/recognizers/Recognizer').Recognizer;
const { performance } = require('perf_hooks');
/**
 * The $P+ Point-Cloud Recognizer (JavaScript version)
 *
 *  Radu-Daniel Vatavu, Ph.D.
 *  University Stefan cel Mare of Suceava
 *  Suceava 720229, Romania
 *  vatavu@eed.usv.ro
 *
 * The academic publication for the $P+ recognizer, and what should be
 * used to cite it, is:
 *
 *     Vatavu, R.-D. (2017). Improving gesture recognition accuracy on
 *     touch screens for users with low vision. Proceedings of the ACM
 *     Conference on Human Factors in Computing Systems (CHI '17). Denver,
 *     Colorado (May 6-11, 2017). New York: ACM Press, pp. 4667-4679.
 *     https://dl.acm.org/citation.cfm?id=3025941
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2017-2018, Radu-Daniel Vatavu and Jacob O. Wobbrock. All
 * rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the University Stefan cel Mare of Suceava, nor the
 *      names of its contributors may be used to endorse or promote products
 *      derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Radu-Daniel Vatavu OR Lisa Anthony
 * OR Jacob O. Wobbrock BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
**/

//
// Point class
//
class Point {
	constructor(x, y, z, id, angle = 0.0) {
        this.x = x;
        this.y = y;
        this.z = z;
		this.id = id;
		this.angle = angle; // normalized turning angle, $P+
    }
}

//
// PointCloud class: a point-cloud template
//
function PointCloud(name, articulations) // constructor
{
	this.Name = name;
	this.Articulations = Resample(articulations, NumPoints);
	this.Articulations = Scale(this.Articulations);
	this.Articulations = TranslateTo(this.Articulations, Origin);
	this.Articulations = ComputeNormalizedTurningAngles(this.Articulations); // $P+
}

//
// PDollarPlusRecognizer constants
//
NumPoints = 8;
NumArticulations = 2;
const Origin = new Point(0, 0, 0, 0);
const name = "P3DollarPlusXRecognizer";
//
// PDollarPlusRecognizer class
//
class P3DollarPlusXRecognizer extends Recognizer {

	 

    constructor(Parameters) {	
		super();	 
		NumPoints = Parameters.numPoints;
		this.PointClouds = new Array();
		this.conflicts = {};
	}
	
	//
	// The $P+ Point-Cloud Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), DeleteUserGestures()
	//
	recognize(sample, Artic_Names) {
		let articulations = convert(sample, Artic_Names);
		let t0 = performance.now();
		var candidate = new PointCloud("", articulations);
		let tPreprocess = performance.now();
		var {u, b} = this.recognizeHelper(candidate);

		if (u != -1 && this.conflicts.hasOwnProperty(this.PointClouds[u].Name)) {
			let dirDist1 = DirDist(candidate.Articulations, this.PointClouds[u].Articulations);
			let dirDist2 = DirDist(candidate.Articulations, this.PointClouds[this.conflicts[this.PointClouds[u].Name].index].Articulations);
			u = dirDist1 > dirDist2 ? u : this.conflicts[this.PointClouds[u].Name].index;
		}

		let t1 = performance.now();
		return (u == -1) ? { 'Name': 'No match', 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess /**, 'Score': 0.0 */} : { 'Name': this.PointClouds[u].Name, 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess /**, 'Score': b > 1.0 ? 1.0 / b : 1.0 */};
	}

	addGesture(name, sample, ArticulationsNames) {
		let articulations = convert(sample, ArticulationsNames);
		var template = new PointCloud(name, articulations);

		if (this.PointClouds.length > 0) {
			const {u, b} = this.recognizeHelper(template);

			if (u != -1 && this.PointClouds[u].Name != name && (1.0 / b) > 0.8) {
				this.conflicts[name] = {'name': this.PointClouds[u].Name, 'index': u};
				this.conflicts[this.PointClouds[u].Name] =  {'name': name, 'index': this.PointClouds.length};
			}
		}

		this.PointClouds[this.PointClouds.length] = template;

		var num = 0;
		for (var i = 0; i < this.PointClouds.length; i++) {
			if (this.PointClouds[i].Name == name)
				num++;
		}
		return num;
	}

	recognizeHelper(pointcloud) {
		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.PointClouds.length; i++) // for each point-cloud template
		{
			if (pointcloud.Articulations.length == this.PointClouds[i].Articulations.length) {
			var d = Math.min(
				CloudDistance(pointcloud.Articulations, this.PointClouds[i].Articulations, b),
				CloudDistance(this.PointClouds[i].Articulations, pointcloud.Articulations, b)
				); // $P+
			if (d < b) {
				b = d; // best (least) distance
				u = i; // point-cloud index
			}
		}
	}
		return {u, b};
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
			});/*
			sample.paths[Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
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

//
// Private helper functions from here on down
//
function CloudDistance(articulationsA, articulationsB, minSoFar) // revised for $P+
{
	let dissimilarity = 0;

	// all shapes from articulationsB are *not* matched for now
	let matchedPoints = [];
	for (let b = 0; b < articulationsA.length; b += 1) {
		matchedPoints[b] = [];
		for (let j = 0; j < articulationsA[b].length; j += 1) {
			matchedPoints[b][j] = false;
		}
	}
	// match each shape from articulationsA with the closest shape from
	// articulationsB that belongs to the same articulation
	for (let a = 0; a < articulationsA.length; a += 1) {
		for (let i = 0; i < articulationsA[a].length; i += 1) {
			let minD = +Infinity;
			let indexPoint = -1;
			for (let j = 0; j < NumPoints; j += 1) {
				let d = DistanceWithAngle(articulationsA[a][i], articulationsB[a][j]);
				if (d < minD) {
					minD = d;
					indexPoint = j;
				}
			}
			dissimilarity += minD;
			matchedPoints[a][indexPoint] = true;
			if (dissimilarity > minSoFar) return dissimilarity; // early abandoning
		}
	}
	// match each shape from articulationsB that has not been matched yet with the
	// closest shape from articulationsA that belongs to the same articulation
	for (let b = 0; b < articulationsA.length; b += 1) {
		for (let j = 0; j < NumPoints; j += 1) {
			if (!matchedPoints[b][j]) {
				let minD = +Infinity;
				for (let i = 0; i < NumPoints; i += 1) {
					let d = DistanceWithAngle(articulationsA[b][i], articulationsB[b][j]);
					if (d < minD) minD = d;
				}
				dissimilarity += minD;
				matchedPoints[b][j] = true;
				if (dissimilarity > minSoFar) return dissimilarity; // early abandoning
			}
		}
	}

	return dissimilarity;
}

function Resample(articulations, n) {
	let resampledArticulations = [];
	let arts = [];
	for (let a = 0; a < articulations.length; a += 1) {
		resampledArticulations[a] = [articulations[a][0]];
		// avoid modifying the original array (cfr call to splice method below)
		arts[a] = articulations[a].slice(0, articulations[a].length);
	}

	// and the total length of each articulation's points
	let intervals = [];
	for (let a = 0; a < articulations.length; a += 1) {
		intervals[a] = PathLength(articulations[a]) / (n - 1);
	}

	let dist = [];
	for (let a = 0; a < articulations.length; a += 1) {
		dist[a] = 0.0;
	}
	for (let a = 0; a < articulations.length; a += 1) {
		for (var i = 1; i < arts[a].length; i++) {
			if ((arts[a][i].x == arts[a][i - 1].x && arts[a][i].y == arts[a][i - 1].y && arts[a][i].z == arts[a][i - 1].z)) {

			}
			else {
				if (arts[a][i].id == arts[a][i - 1].id) {
					let dist2 = Distance(arts[a][i - 1], arts[a][i]);
					if ((dist[a] + dist2) >= intervals[a]) {
						let qx = arts[a][i - 1].x + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].x - arts[a][i - 1].x);
						let qy = arts[a][i - 1].y + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].y - arts[a][i - 1].y);
						let qz = arts[a][i - 1].z + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].z - arts[a][i - 1].z);

						var q = new Point(qx, qy, qz, arts[a][i].id);
						resampledArticulations[a][resampledArticulations[a].length] = q; // append new point 'q'
						arts[a].splice(i, 0, q);
						dist[a] = 0.0;
					}
					else dist[a] += dist2;
				}
			}
		}
	}

	// it may fall a rounding-error short of adding the last articulation's point
	for (let a = 0; a < articulations.length; a += 1) {
		while (resampledArticulations[a].length < n) {
			resampledArticulations[a].push(arts[a][arts[a].length - 1]);
		}
	}
	return resampledArticulations;
}

function Scale(articulations) {
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity, minZ = +Infinity, maxZ = -Infinity;
	for (let a = 0; a < articulations.length; a += 1) {
		for (let i = 0; i < articulations[a].length; i += 1) {
			minX = Math.min(minX, articulations[a][i].x);
			minY = Math.min(minY, articulations[a][i].y);
			minZ = Math.min(minZ, articulations[a][i].z);
			maxX = Math.max(maxX, articulations[a][i].x);
			maxY = Math.max(maxY, articulations[a][i].y);
			maxZ = Math.max(maxZ, articulations[a][i].z);
		}
	}
	var size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
	let newArticulations = [];
	for (let a = 0; a < articulations.length; a += 1) {
		newArticulations[a] = [];
		for (let i = 0; i < articulations[a].length; i += 1) {
			newArticulations[a][i] = new Point(
				(articulations[a][i].x - minX) / size,
				(articulations[a][i].y - minY) / size,
				(articulations[a][i].z - minZ) / size,
				articulations[a][i].id
			);
		}
	}
	return newArticulations;
}

function TranslateTo(articulations, pt) // translates points' centroid
{
	let newArticulations = [];
	var centroid = Centroid(articulations);
	for (let a = 0; a < articulations.length; a += 1) {
		newArticulations[a] = [];
		for (let i = 0; i < articulations[a].length; i += 1) {
			newArticulations[a][i] = new Point(
				articulations[a][i].x + pt.x - centroid.x,
				articulations[a][i].y + pt.y - centroid.y,
				articulations[a][i].z + pt.z - centroid.z,
				articulations[a][i].id
			);
		}
	}
	return newArticulations;
}

function ComputeNormalizedTurningAngles(articulations) // $P+
{
	let newArticulations = [];
	for (let a = 0; a < articulations.length; a += 1) {
		newArticulations[a] = [];
		newArticulations[a][0] = new Point(articulations[a][0].x, articulations[a][0].y, articulations[a][0].z, articulations[a][0].id); // first point
		for (var i = 1; i < articulations[a].length - 1; i++) {
			var dx = (articulations[a][i + 1].x - articulations[a][i].x) * (articulations[a][i].x - articulations[a][i - 1].x);
			var dy = (articulations[a][i + 1].y - articulations[a][i].y) * (articulations[a][i].y - articulations[a][i - 1].y);
			var dz = (articulations[a][i + 1].z - articulations[a][i].z) * (articulations[a][i].z - articulations[a][i - 1].z);
			var dn = Distance(articulations[a][i + 1], articulations[a][i]) * Distance(articulations[a][i], articulations[a][i - 1]);
			var cosangle = Math.max(-1.0, Math.min(1.0, (dx + dy + dz) / dn)); // ensure [-1,+1]
			var angle = Math.acos(cosangle) / Math.PI; // normalized angle
			newArticulations[a][newArticulations[a].length] = new Point(articulations[a][i].x, articulations[a][i].y, articulations[a][i].z, articulations[a][i].id, angle);
		}
	}
	for (let a = 0; a < articulations.length; a += 1) {
		newArticulations[a][newArticulations[a].length] = new Point( // last point
			articulations[a][articulations[a].length - 1].x,
			articulations[a][articulations[a].length - 1].y,
			articulations[a][articulations[a].length - 1].z,
			articulations[a][articulations[a].length - 1].id);
	}
	return newArticulations;
}

function Centroid(articulations) {
	let count = 0;
	let dX = 0.0, dY = 0.0, dZ = 0.0;
	for (let a = 0; a < articulations.length; a += 1) {
		for (let i = 0; i < articulations[a].length; i += 1) {
			dX += articulations[a][i].x;
			dY += articulations[a][i].y;
			dZ += articulations[a][i].z;
			count += 1;
		}
	}
	return new Point(dX / count, dY / count, dZ / count);
}

function PathLength(points) // length traversed by a point path
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++) {
		if (points[i].id == points[i-1].id)
			d += Distance(points[i-1], points[i]);
	}
	return d;
}

function DistanceWithAngle(p1, p2) // $P+
{
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	var dz = p2.z - p1.z;
	var da = p2.angle - p1.angle;
	return Math.sqrt(dx * dx + dy * dy + dz * dz + da * da);
}

function Distance(p1, p2) // Euclidean distance between two points
{
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	var dz = p2.z - p1.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function DirDist(articulationsA, articulationsB) {
	const padding = 2;
	let dist = 0;
	for (let a = 0; a < articulationsA.length; a += 1) {
	for (var i = padding; i < NumPoints - (1 + padding); i+=1) {
		let v1x = articulationsA[a][i+1].x - articulationsA[a][i].x;
		let v1y = articulationsA[a][i+1].y - articulationsA[a][i].y;
		let v1z = articulationsA[a][i+1].z - articulationsA[a][i].z;
		let v2x = articulationsB[a][i+1].x - articulationsB[a][i].x;
		let v2y = articulationsB[a][i+1].y - articulationsB[a][i].y;
		let v2z = articulationsB[a][i+1].z - articulationsB[a][i].z;
		dist += v1x * v2x + v1y * v2y + v1z * v2z;
	}
}
	return dist;
}

module.exports = {
	Point,
	P3DollarPlusXRecognizer
};