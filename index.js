const OrbitControls = require('three-orbit-controls')(THREE)
const createLissajous3D = require('./boids/createLissajous3D');
const createPaths = require('./boids/createPaths');
const CCapture = require('ccapture.js');


// Settings
var width;
var height;
var framerate = 20;
var saveFrames = false;
var frames = 60;
var obj;
var guiController;
var frame = 0;
var saved = false;
var scene;
var canvas;
var renderer;
var capturer;
var animate = true;

init();
render();

function init() {
	width = window.innerWidth;
	height = window.innerHeight;

	// Renderer and Canvas
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize( width, height );
	canvas = renderer.domElement;
	document.body.appendChild(canvas);

	// Scene
	scene = new THREE.Scene();

	// Camera
	camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
	camera.position.z = 12;
	camera.lookAt(new THREE.Vector3());
	controls = new OrbitControls(camera, canvas);

	setupGui();
	createObject();

	window.addEventListener( 'resize', onWindowResize, false );
};

function render() {
	var t = frame / frames;
	let time = performance.now();
	obj.update(frame, animate);

	// Manually set frame rate
	if(saveFrames){
		requestAnimationFrame( render );
	}else{
		setTimeout( function() {
			requestAnimationFrame( render );
		}, 1000 / framerate);
	}

	// Render scene
	renderer.render( scene, camera );

	if(animate){
		if(saveFrames){
			if(capturer === undefined){
				console.log('Start capture');
				capturer = new CCapture({ 
					format: 'png',
					verbose: true
				});
				capturer.start();
			}

			if(frames <= frame){
				capturer.stop();
				capturer.save();
				saveFrames = false;
			}else{
				capturer.capture( canvas );		
			}
			frame++;
		}else{
			frame = (frame + 1) % frames;	
		}
	}
};

function createObject() {
	if ( obj !== undefined ) {
		obj.mesh.geometry.dispose();
		scene.remove(obj.mesh);
	}

	switch (guiController.shape) {
		case "random path": obj = createPaths(frames); break;
		case "lissajous": 	obj = createLissajous3D(frames); break;
		default: console.log("missing shape : " + guiController.shape); return;
	};
	scene.add(obj.mesh);
};

function setupGui() {
	guiController = {
		shape: "random path",
		animate: animate,
		capture: function() {
			frame = 0;
			saveFrames = true;
		},
		resolution: "Fullscreen"
	};
	var h, gui = new dat.GUI();

	h = gui.addFolder("Shape");
	h.add(guiController, "shape", ["lissajous", "random path"]).name("Shape").onChange(createObject);
	h.add(guiController, "animate", true).name("Animate").onChange(function(){
		animate = guiController.animate;
	});
	
	h = gui.addFolder("Capture");
	h.add(guiController, "capture").name("Capture Animation");
	h.add(guiController, "resolution", ["Fullscreen", "600x600", "800x600", "640x360", "720x405", "768x423"]).onChange(function(){
		switch(guiController.resolution) {
			case "600x600": width = 600; height = 600; break;
			case "800x600": width = 800; height = 600; break;
			case "640x360": width = 640; height = 360; break;
			case "720x405": width = 720; height = 405; break;
			case "768x423": width = 768; height = 423; break;
			case "Fullscreen": width = window.innerWidth; height = window.innerHeight; break;
			default: console.log("missing resolution : " + guiController.resolution); return;
		};

		renderer.setPixelRatio(width/height);
		renderer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	});
};

function onWindowResize( event ) {
	if(guiController.resolution === "Fullscreen"){
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
    	camera.updateProjectionMatrix();
	}
};