// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/

let mySize;

// a shader variable
function preload() {
	//theShader = new p5.Shader(this.renderer, vert, frag)
  //theShader = create(this.renderer,shader.vert, );
  //theShader = new p5.Shader(loadShader('/sketches/shader.vert', '/sketches/shader.frag'));
}

let theShader;

function setup() {
	createCanvas(400, 400, WEBGL);
  theShader = createShader('/sketches/shader.vert', '/sketches/shader.frag');
	// shaders require WEBGL mode to work
	noStroke();
}

function draw() {
	// shader() sets the active shader with our shader
  shader(theShader);
  rect(0,0,100,100)
	theShader.setUniform("u_resolution", [width, height]);
	theShader.setUniform("u_time", millis() / 1000.0);
	theShader.setUniform("u_frame", frameCount / 10.0);
	theShader.setUniform("u_mouse", [mouseX / 100.0, map(mouseY, 0, height, height, 0) / 100.0]);

	// rect gives us some geometry on the screen
  //circle(width, height, 100, 100);
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/