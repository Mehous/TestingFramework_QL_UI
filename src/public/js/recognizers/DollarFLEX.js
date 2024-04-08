const Recognizer = require('../framework/recognizers/Recognizer').Recognizer;


/**
 *  $-family for hand gesture recognition
 *    w/ 3D points;
 *    w/ flexible cloud matching:
 *      
 *
 *  Jackknife's LeapMotion dataset, p=20, gc=8, maxT=1, n=8: 99.52% (0.28ms)
 *  Jackknife's LeapMotion dataset, p=20, gc=8, maxT=1, maxP=1, n=8: 85.69% (0.30ms)
 *  Jackknife's LeapMotion dataset, p=20, gc=8, maxT=1, maxP=2, n=8: 91.87% (0.47ms)
 *  Jackknife's LeapMotion dataset, p=20, gc=8, maxT=1, maxP=3, n=8: 93.62% (0.63ms)
 *  Jackknife's LeapMotion dataset, p=20, gc=8, maxT=1, maxP=4, n=8: 94.63% (0.79ms)
 *  Jackknife's LeapMotion dataset, p=20, gc=8, maxT=1, maxP=5, n=8: 95.33% (0.93ms)
 */


/**
 *  Point constructor.
 */
class Point {
  constructor(x, y, z) {
    // (x, y, z) coordinates
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

numberOfPoints = 8;
numberOfArticulations=1;
/**
 * Gesture constructor.
 */
function Gesture(path, name) {
  // name of the gesture class
  this.name = name;
  // array of points
  this.Articulations = path;
}



const { performance } = require('perf_hooks');
const name = "DollarFlex";
/**
 *  UVPRecognizer constructor.
 */
class DollarFLEX extends Recognizer {
  constructor(Parameters, dataset) {
    super();
    numberOfPoints = Parameters.numPoints;
    numberOfArticulations=Parameters.articulationName.length;
    this.trainingTemplates = new Array();
  }

  /**
   *  Transform an array of points into a template via  preprocessing.
   *
   *  @return true the template was successfully saved; false otherwise
   */
  addGesture(name, path, ArticulationsNames) {
    let articulations = convert(path,ArticulationsNames);
    let template = new Gesture(this.preprocess(articulations), name);
    this.trainingTemplates.push(template);
    var num = 0;
    for (var i = 0; i < this.trainingTemplates.length; i++) {
      if (this.trainingTemplates[i].Name == name)
        num++;
    }
    return num;
  }
  /**
   *  Determine the gesture class of an array of  points (candidate)
   *  after preprocessing and cloud-matching against the stored training templates.
   *
   *  @return an array with the least dissimilar training template and the time
   *  required to perform the recognition in ms.
   */
  recognize(path, Artic_Names) {
    
    let articulations = convert(path, Artic_Names);
    // start timer
    let t0 = performance.now();

    let minDissimilarity = +Infinity;
    let bestTemplate = -1;

    // preprocess the points to represent the candidate gesture

    let candidate = new Gesture(this.preprocess(articulations), "");
    let tPreprocess = performance.now();

    // cloud-matching against all stored training templates
    for (let t = 0; t < this.trainingTemplates.length; t += 1) {
      if (candidate.Articulations.length == this.trainingTemplates[t].Articulations.length) {
      let dissimilarity = cloudMatching(
        candidate.Articulations, this.trainingTemplates[t].Articulations, minDissimilarity
      );

      // if less dissimilar: update info
      if (dissimilarity < minDissimilarity) {
        minDissimilarity = dissimilarity;
        bestTemplate = t;
      }
    }
  }
    let t1 = performance.now();
    return (bestTemplate == -1) ? { 'Name': 'No match', 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess /**, 'Score': 0.0 */} : { 'Name': this.trainingTemplates[bestTemplate].name, 'Time': t1 - t0,'PreProcessTime': tPreprocess - t0,'ClassificationTime': t1 - tPreprocess /**, 'Score': b > 1.0 ? 1.0 / b : 1.0 */};
  }

  /**
   *  Transform an array of points into an array of points after resampling, scaling, and translation.
   *
   *  @return an array of points.
   */
  preprocess(path) {
    return translate(
      scale(
        resample(path)
      ),
      new Point(0, 0, 0)
    );
  }
}


/**
 *  Resample an array of points.
 *
 *  @return an array of resampled points.
 */
function resample(articulations) {
  let resampledArticulations = [];
  let arts = [];
  for (let a = 0; a < numberOfArticulations; a += 1) {
    resampledArticulations[a] = [articulations[a][0]];
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
    for (let i = 1; i < arts[a].length; i += 1) {
      let dist2 = betweenPointsEuclideanDistance(arts[a][i - 1], arts[a][i]);
      if ((dist[a] + dist2) >= intervals[a]) {
        let p = new Point(
          arts[a][i - 1].x + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].x - arts[a][i - 1].x),
          arts[a][i - 1].y + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].y - arts[a][i - 1].y),
          arts[a][i - 1].z + ((intervals[a] - dist[a]) / dist2) * (arts[a][i].z - arts[a][i - 1].z)
        );
        resampledArticulations[a].push(p);
        arts[a].splice(i, 0, p);
        dist[a] = 0.0;
      }
      else dist[a] += dist2;
    }
  }

  // it may fall a rounding-error short of adding the last articulation's point
  for (let a = 0; a < numberOfArticulations; a += 1) {
    while (resampledArticulations[a].length <= numberOfPoints) {
      resampledArticulations[a].push(arts[a][arts[a].length - 1]);
    }
  }

  return resampledArticulations;
}

/**
 *  Scale all  points.
 *
 *  @return the scaled  points.
 */
function scale(articulations) {
  // compute the min and max values for x, y, and z coordinates
  let minX = +Infinity, maxX = -Infinity;
  let minY = +Infinity, maxY = -Infinity;
  let minZ = +Infinity, maxZ = -Infinity;
  for (let a = 0; a < numberOfArticulations; a += 1) {
    for (let i = 0; i < numberOfPoints; i += 1) {
  		minX = Math.min(minX, articulations[a][i].x);
  		minY = Math.min(minY, articulations[a][i].y);
      minZ = Math.min(minZ, articulations[a][i].z);
  		maxX = Math.max(maxX, articulations[a][i].x);
  		maxY = Math.max(maxY, articulations[a][i].y);
      maxZ = Math.max(maxZ, articulations[a][i].z);
  	}
  }
  // scale all articulations' points
  let size = Math.max(maxX - minX, Math.max(maxY - minY, maxZ - minZ));
  let newArticulations = [];
  for (let a = 0; a < numberOfArticulations; a += 1) {
    newArticulations[a] = [];
    for (let i = 0; i < numberOfPoints; i += 1) {
      newArticulations[a][i] = new Point(
        (articulations[a][i].x - minX) / size,
        (articulations[a][i].y - minY) / size,
        (articulations[a][i].z - minZ) / size
      );
    }
  }
	return newArticulations;
}

/**
 *  Translate all  points towards the reference.
 *
 *  @return the translated  points.
 */
function translate(articulations, reference) {
	let newArticulations = [];
  let centroid = Centroid(articulations);
  for (let a = 0; a < numberOfArticulations; a += 1) {
    newArticulations[a] = [];
    for (let i = 0; i < numberOfPoints; i += 1) {
  		newArticulations[a][i] = new Point(
        articulations[a][i].x + reference.x - centroid.x,
        articulations[a][i].y + reference.y - centroid.y,
        articulations[a][i].z + reference.z - centroid.z
      );
  	}
  }
	return newArticulations;
}


/**
 *  Compute the global centroid of all  points.
 *
 *  @return the centroid of all points.
 */
function Centroid(articulations) {
  let count = 0;
  let dX = 0.0, dY = 0.0, dZ = 0.0;
  for (let a = 0; a < numberOfArticulations; a += 1) {
    for (let i = 0; i < articulations[a].length; i += 1) {
      dX += articulations[a][i].x;
      dY += articulations[a][i].y;
      dZ += articulations[a][i].z;
      count += 1;
    }
  }
  return new Point(dX / count, dY / count, dZ / count);
}

/**
 *  Compute the path length of an array of points: the sum of the Euclidean
 *  distance between the consecutive points.
 *
 *  @return the path length of an array of points.
 */
function pathLength(points) {
  let length = 0.0;
  for (let i = 1; i < points.length - 1; i += 1) {
    length += betweenPointsEuclideanDistance(points[i - 1], points[i]);
  }
  return length;
}

/**
 *  Compute the Euclidean distance between two points a and b.
 *
 *  @return the Euclidean distance between two points a and b.
 */
function betweenPointsEuclideanDistance(a, b) {
  let dX = b.x - a.x;
  let dY = b.y - a.y;
  let dZ = b.z - a.z;
  return Math.sqrt(dX * dX + dY * dY + dZ * dZ);
}


/**
 *  Compute the dissimilarity score between two arrays of poitns via the
 *   cloud matching procedure in both directions.
 *
 *  @return the dissimilarity score between two arrays of points.
 */
function cloudMatching(pathA, pathB, minSoFar) {
  return Math.min(
    cloudDistance(pathA, pathB, minSoFar),
    cloudDistance(pathB, pathA, minSoFar)
  );
}


/**
 *  Compute the dissimilarity score between two arrays of points via
 *  the flexible cloud matching procedure: points from the first array can be
 *  matched to any points that belongs to the second
 *  array, and points from the second array that have not been matched yet can
 *  be matched to any point that belongs to the first
 *  array, this method include an early abandonning condition if the dissimilarity isn't better than
 *  the dissimilarity of another templates.
 *
 *  @return the dissimilarity score between two arrays of points.
 */
function cloudDistance(articulationsA, articulationsB, minSoFar) {
  let dissimilarity = 0;

  // all shapes from articulationsB are *not* matched for now
  let matchedPoints = [];
  for (let b = 0; b < numberOfArticulations; b += 1) {
    matchedPoints[b] = [];
    for (let j = 0; j < numberOfPoints; j += 1) {
      matchedPoints[b][j] = false;
    }
  }

  // match each shape from articulationsA with the closest shape from
  // articulationsB that belongs to the same articulation
  for (let a = 0; a < numberOfArticulations; a += 1) {
    for (let i = 0; i < numberOfPoints; i += 1) {
      let minD = +Infinity;
      let indexPoint = -1;
      for (let j = 0; j < numberOfPoints; j += 1) {
        let d = betweenPointsEuclideanDistance(articulationsA[a][i], articulationsB[a][j]);
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
  for (let b = 0; b < numberOfArticulations; b += 1) {
    for (let j = 0; j < numberOfPoints; j += 1) {
      if(!matchedPoints[b][j]) {
        let minD = +Infinity;
        let indexPoint = -1;
        for (let i = 0; i < numberOfPoints; i += 1) {
          let d = betweenPointsEuclideanDistance(articulationsA[b][i], articulationsB[b][j]);
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
		/*	sample.paths[Artic_Names[i]].strokes.forEach((stroke, stroke_id) => {
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
 

module.exports = {
  Point,
  DollarFLEX
};