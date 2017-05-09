module.exports = function ( frames ) {

	function lissajous () {}
	lissajous.prototype = Object.create( THREE.Curve.prototype );
	lissajous.prototype.constructor = lissajous;
	lissajous.prototype.getPoint = function( t ) {
		var x = 1.5 * Math.sin(2 * Math.PI * t + 0.25 * Math.PI);
		var y = 1.5 * Math.cos(6 * Math.PI * t - 0.12 * Math.PI);
		var z = 1.5 * Math.sin(8 * Math.PI * t + 0.33 * Math.PI);
		return new THREE.Vector3( x, y, z );
	};

	const segments = 1000;
	const radiusSegments = 8;
	const geometry = new THREE.TubeBufferGeometry(new lissajous(), segments, 0.1, radiusSegments, true);
	const material = new THREE.MeshNormalMaterial();
	const mesh = new THREE.Mesh(geometry, material);

	return { mesh: mesh, update }

	function update ( frame = 0, animate = true ) {
  		var t = frame / frames;
  		if ( animate ){
  			mesh.rotation.y = 2 * Math.PI * t;
  		}
  	}
}