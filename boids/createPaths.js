const glslify = require('glslify');
const path = require('path');

randomVector = function ( r = 1.0 ) {
	var theta = 2*Math.PI*Math.random();
	var phi = Math.acos(2*Math.random() - 1);
	
	var x = r * Math.cos(theta) * Math.sin(phi);
	var y = r * Math.sin(theta) * Math.sin(phi);
	var z = r * Math.cos(phi);

	return new THREE.Vector3(x, y, z);
}
randomBallPoint = function ( r = 1.0 ) {
	var r0 = Math.pow(r*r*r*Math.random(), 1/3);
	var theta = 2*Math.PI*Math.random();
	var phi = Math.acos(2*Math.random() - 1);

	var x = r0 * Math.cos(theta) * Math.sin(phi);
	var y = r0 * Math.sin(theta) * Math.sin(phi);
	var z = r0 * Math.cos(phi);

	return new THREE.Vector3(x, y, z);
}

generateSpherePath = function ( n = 1000, radius = 2.0, dt = 0.1, w = 0.2, noise = 0.5) {
	var points = new Array();
	var center = new THREE.Vector3(0.0, 0.0, 0.0);
	var oldPos = randomVector( radius );
	var oldVel = randomVector();
	var normal = new THREE.Vector3();
	
	for(var i = 0; i < n; i++) {
		// Calculate normal vector
		normal.subVectors(oldPos, center);
		var d = normal.length() - radius;
		normal.normalize();
		
		// Calculate new velocity vector
		var newVel = new THREE.Vector3();
		newVel.copy(oldVel);
		newVel.projectOnPlane(normal);
		newVel.add(randomVector(noise));
		newVel.addScaledVector(normal, -w*d*d*Math.sign(d));
		newVel.normalize();

		// Adapt direction of velocity to old velocity
		newVel.add(oldVel);
		newVel.normalize();

		// Calculate new point
		var newPos = new THREE.Vector3();
		newPos.copy(oldPos);
		newPos.addScaledVector(newVel, dt);

		points[i] = newPos;
		oldPos.copy(newPos);
		oldVel.copy(newVel);
	}
	return points;
}

generateMetaballsPoints = function ( n = 200, m = 12, radius = 2.0, threshold = 8.0, showTraces = true ) {
	var points = new Array();

	// Create centroids of the metaballs
	var centroids = new Array();
	for (var i = 0; i < m; i++) {
		//centroids[i] = randomBallPoint( radius );
		var phi = 2.0 * Math.PI * i / m;
		centroids[i] = new THREE.Vector3(0.8 * radius * Math.cos(phi), 
										 0.8 * radius * Math.sin(phi), 0.0);
	}

	var dt = 0.03, dTotal = radius * 4.0;
	for(var i = 0; i < n; i++) {
		var point = randomVector( radius * 2.0 );
		var found = false;
		var maxVal = 0.0, minVal = 10000000.0;

		for(var t = 0.0; t < dTotal; t += dt){
			// Calculate normal vector to metaballs
			var normal = new THREE.Vector3();
			var localDirection = new THREE.Vector3();
			for (var j = 0; j < centroids.length; j++) {
				localDirection.subVectors(centroids[j], point);
				normal.addScaledVector(localDirection, 1.0 / localDirection.lengthSq());
			}
			normal.normalize();
			point.addScaledVector(normal, dt);
			
			// Evaluate function for new point
			var val = 0.0;
			for (var j = 0; j < centroids.length; j++) {
				localDirection.subVectors(centroids[j], point);
				val += 1.0 / localDirection.length();
			}
			maxVal = Math.max(maxVal, val);
			minVal = Math.min(minVal, val);

			// Break if value exceeds threshold
			if(val > threshold){ found = true; break; }
			if(showTraces){
				var p = new THREE.Vector3();
				p.copy(point);
				points.push(p);		
			}
		}
		
		//console.log("Min : " + minVal + ", Max : " + maxVal + ", found : " + found);
		if (found && !showTraces) { points.push(point);	}
	}
	console.log("Number of points : " + points.length);
	return points;
}

generateMetaballsPath = function ( n = 1000, m = 6, radius = 2.0, dt = 0.1, noise = 0.35, threshold = 10.0 ) {
	var points = new Array();
	var oldPos = randomVector( 0.5 * radius );
	var oldVel = randomVector();
	var normal = new THREE.Vector3();
	var factor = 0.2;

	// Create centroids of the metaballs
	var centroids = new Array();
	for (var i = 0; i < m; i++) {
		//centroids[i] = randomBallPoint( radius );
		var phi = 2.0 * Math.PI * i / m;
		centroids[i] = new THREE.Vector3(radius * Math.cos(phi), 
										 radius * Math.sin(phi), 0.0);
	}

	for(var i = 0; i < n; i++) {
		var normal = new THREE.Vector3();
		var localDirection = new THREE.Vector3();
		var val = 0.0;
		for (var j = 0; j < centroids.length; j++) {
			localDirection.subVectors(oldPos, centroids[j]);
			normal.addScaledVector(localDirection, 1.0 / localDirection.lengthSq());
			val += 1.0 / localDirection.length();
		}
		normal.normalize();

		var newVel = new THREE.Vector3();
		newVel.copy(oldVel);
		newVel.projectOnPlane(normal);
		newVel.normalize();
		newVel.multiplyScalar(1.0 - factor);
		newVel.add(randomVector(noise));
		newVel.addScaledVector(normal, factor * Math.sign(val - threshold));
		newVel.normalize();

		// Adapt direction of velocity to old velocity
		newVel.add(oldVel);
		newVel.normalize();

		var p = new THREE.Vector3();
		p.copy(oldPos);
		p.addScaledVector(newVel, dt);

		points.push(p);
		oldPos.copy(p);
		oldVel.copy(newVel);
	}
	console.log("Number of points : " + points.length);
	return points;
}

simplePointCloud = function ( points ) {
	const geometry = new THREE.Geometry();
	for (var i = 0; i < points.length; i++) {
		geometry.vertices.push(points[i]);
	}
	const material = new THREE.PointsMaterial({ color: 0x00eeee, size: 0.1 });
	const mesh = new THREE.Points(geometry, material);
	return mesh;
}

lineMesh = function ( points ) {
	var curve = new THREE.CatmullRomCurve3( points );
	var geometry = new THREE.Geometry();
	geometry.vertices = curve.getPoints( 2000 );
	var material = new THREE.LineBasicMaterial( { color : 0x00eeee } );
	return new THREE.Line( geometry, material );
}

tubeMesh = function ( points, segments = 2000, radius = 0.05, radiusSegments = 8 ) {
	var curve = new THREE.CatmullRomCurve3( points );
	var geometry = new THREE.TubeBufferGeometry( curve, segments, radius, radiusSegments, false );
	var material = new THREE.MeshNormalMaterial();
	return new THREE.Mesh( geometry, material );
}

module.exports = function ( frames ) {
	//const points = generateSpherePath();
	//const points = generateMetaballsPoints();
	const points = generateMetaballsPath();
	
	//const mesh = simplePointCloud( points );
	//const mesh = lineMesh( points );
	const mesh = tubeMesh( points );

	return { mesh: mesh, update }

	function update ( frame = 0, animate = true ) {
  		var t = frame / frames;
  		if ( animate ) {
  			mesh.rotation.y = 2 * Math.PI * t;
  		}
  	}
}