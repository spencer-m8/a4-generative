// =============================================
// remix.js — your combined sketch
// This is where sketch1 and sketch2 come together
// into something new
// =============================================

const frag = `

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse; //vec2 here

float hash(vec2 p){
    return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}

float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i+vec2(1.0,0.0));
    float c = hash(i+vec2(0.0,1.0));
    float d = hash(i+vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

vec2 rot(vec2 p, float a){
    float c = cos(a), s = sin(a);
    return mat2(-c,-s,s,c)*p;
}

float rippleWave(vec2 p, vec2 center, float t, float id, float size){
    float dist = length(p - center);
    float y = u_mouse.y;//getting mousey
	 y = y*10.0;
	 y = ((y - 0.0) / (80.0 - 0.0) * (0.004-0.001) + 0.001);
    float x = u_mouse.x;
	float wave = sin(dist * size*y - t * 0.5 - id * (y/300.0 * 0.3/x)) -0.5;
    float mask = exp(-dist * 3.0); //sign controls whether the layers are additive or subtractive
    return wave * mask;
}

float brushShape(vec2 p){
    float d = length(vec2(p.x * 10.0, p.y));//created strokes size
    float jitter = noise(p * 3.0) * 1.0;
	 float x = u_mouse.x;
    return exp(-(d + jitter) * 250.0 + x);//using x to mod
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (uv * 1.0 - 1.0); 
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time;
    float paper = noise(p * 10.0) * 0.5 + noise(p * 10.0 + t * 0.05) * 40.0;
	 float mouseX = u_mouse.x;
    float ripple = 0.002;
    for(int i=0; i<3; i++){
        float id = float(i);
        vec2 rc = vec2(
            sin(t * 0.4 + id * 1.5),
            cos(t * 0.3 + id * 1.1)
        ) * .25;
        float randSize = mouseX + hash(vec2(id, 123.4)) * 90.0;
        float strength = cos(t * 0.5 + id * 100.0) * 0.5 + 0.5;
        ripple += rippleWave(p, rc, t, id, randSize*1.0) * 0.5 * strength;
    }

    vec2 flow = p;
    flow += vec2(
        noise(p * 0.8 + t * 0.2),
        noise(p * 0.8 - t * 0.15)
    ) * 0.5;
    flow += normalize(p + 0.001) * ripple * 0.5;

    float ink = 0.50;
    const int STROKES = 200;
    for(int i=0; i<STROKES; i++){
        float id = float(i);
        vec2 center = vec2(sin(t*0.2+id*1.1), cos(t*0.5+id*1.4)) * 0.3;//changing this
		  float mousey = u_mouse.y;
        vec2 pp = rot((flow - center), t * 0.1 + id * mousey/10000.0);//was *10.5
        float pressure = sin(t * 0.2 + id * 3.0) * 0.5 + 4.0;
        float body = brushShape(pp);
        float dry = noise(pp * 50.0 - t * 2.0) * (1.0 - pressure);
        ink += body * (2.0 - dry) * pressure;
    }

    float e = 0.;
    float n1 = ink;
    float n2 = noise((p + vec2(e, 10.0)) * 10.0 + ripple);
    float spec = smoothstep(0.00001, 0.003, n1 - n2); //changing this
    
    float density = ink * (1.25 + paper * 0.2);
    vec3 inkColor = vec3(0.08, 0.07, 0.06);
    vec3 col = mix(vec3(1.0, 0.97, 0.90), inkColor, clamp(density, 0.0, 1.0));

    col += spec * 1.5 * vec3(0.8, 0.9, 1.0);

    col *= smoothstep(2.5, 0.5, length(p));

    gl_FragColor = vec4(pow(col, vec3(1.2)), 1.0);
}

`;

// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/

// vert file and comments from adam ferriss
// https://github.com/aferriss/p5jsShaderExamples

const vert = `
// our vertex data
attribute vec3 aPosition;

// our texcoordinates
attribute vec2 aTexCoord;

void main() {

  // copy the position data into a vec4, using 1.0 as the w component
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

  // send the vertex information on to the fragment shader
  gl_Position = positionVec4;
}
`;

// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/

let mySize;
let symmetry = 5;
let handPose;
let hands = [];
let hue = 0;
let keyPointsX = [];
let keyPointsY = [];
let count = 0;
let avgX = [];
let avgY = [];
let lineStartX = [];
let lineStartY = [];
let lineEndX = [];
let lineEndY = [];
let initializing = true;
let xAdj;
let yAdj;
let BPM = 136;
let lineLength; //line length in frames, lineLength = 60 lines will show for what was drawn in the last 60 frames 
let initCount = 0;

// The angle button will calculate the angle at which each section is rotated.
let angle = 360 / symmetry;
// a shader variable
let theShader;

function preload() {
  theShader = new p5.Shader(this.renderer, vert, frag)
  handPose = ml5.handPose();
}

function setup() {
  lineLength = 60/BPM;
  mySize = min(windowWidth, windowHeight) * 0.75; //downsizing the canvas
  pixelDensity(1);
  // shaders require WEBGL mode to work
  createCanvas(mySize / 16 * 11, mySize, WEBGL);
  
  noStroke();
  angleMode(DEGREES);
  colorMode(HSB);
  background(50);
  let video = createCapture(VIDEO);
  video.hide();
  handPose.detectStart(video, function (results) {
    hands = results;
  });
  xAdj = width/4;
  yAdj = width/4;
}

function draw() {
  if (initializing && (initCount > 240)) {
    initializing = false;
    //console.log(lastKpX + "" + lastKpY);
  } else if (initializing) {
    initCount++;
  }
  count++;
  
//console.log("mouse: " + map(mouseX, 0, width, width, 0) / 10.0, map(mouseY, 0, height, height, 0) / 10.0);
//console.log("kp: "+ map(keyPointsX.at(-1), 0, width, width, 0) / 10.0, map(keyPointsY.at(-1), 0, height, height, 0) /10.0);
  // shader() sets the active shader with our shader
  shader(theShader);
  //translate(w, height);//this could be a problem

  //uniforms are used within the shader code to import values
  theShader.setUniform("u_resolution", [width, height]);
  theShader.setUniform("u_time", millis() / 1000.0);
  theShader.setUniform("u_frame", frameCount / 10.0);
  if (initializing) {
    theShader.setUniform("u_mouse", [map(mouseX, 0, width, width, 0) / 10.0, map(mouseY, 0, height, height, 0) / 10.0]);
  } else {
    theShader.setUniform("u_mouse", [map(keyPointsX.at(-1), 0, width, width, 0) / 10.0, map(keyPointsY.at(-1), 0, height, height, 0) /10.0]); // this works
  }
  //console.log(map(mouseY, 0, height, height, 0)/10.0);

  // rect gives us some geometry on the screen
  rect(0, 0, width, height);


  //shader stuff above ^^^^^
  //---------------------------------------------------

  // Move the 0,0 coordinates of the canvas to the center, instead of in
  // the top left corner.
  resetShader();
  let gl = this._renderer.GL;
  gl.disable(gl.DEPTH_TEST);

  // If the cursor is within the limits of the canvas...
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Translate the current position and the previous position of the
    // cursor to the new coordinates set with the translate() function above.
    for (let hand of hands) {
      if (hands.length == 0) {//skipping the for loop if we have no hands on the screen
        continue;
      }
      for (let kp of hand.keypoints) {
        if (kp.name === "index_finger_tip") {//check if keypoint is index fingertip
          keyPointsX.push(kp.x);
          keyPointsY.push(kp.y);
          //console.log(kp);
        }
        //console.log(count);
        //console.log(keyPointsX);
        //console.log(keyPointsY);
        if (count > lineLength) { //clearing the arrays to save spaceS
          //this is costly
          lastKpX = keyPointsX.at(-1);
          lastKpY = keyPointsY.at(-1);

          keyPointsX.length = 0;
          keyPointsY.length = 0;
          lineStartX.length = 0;
          lineStartY.length = 0;
          lineEndX.length = 0; 
          lineEndY.length = 0;

          keyPointsX.push(lastKpX);
          keyPointsY.push(lastKpY);
          lineStartX.push(lastKpX);
          lineStartY.push(lastKpX);
          lineEndX.push(lastKpX);
          lineEndY.push(lastKpY);
          count = 0;
        }
      }

      //avgX.push(keyPointsX.reduce((a, b) => a + b, 0) / keyPointsX.length);
      //avgY.push(keyPointsY.reduce((a, b) => a + b, 0) / keyPointsY.length);

    }

    lineStartX.push(keyPointsX.at(-2));
    lineStartY.push(keyPointsY.at(-2));
    lineEndX.push(keyPointsX.at(-1));
    lineEndY.push(keyPointsY.at(-1));

    // And, if the mouse is pressed while in the canvas...
    if (mouseIsPressed === true) {
      // For every reflective section the canvas is split into, draw the cursor's
      // coordinates while pressed...
      hue = hue + 2;

      for (let i = 0; i < symmetry; i++) {
        rotate(angle);
        stroke(hue % 360, 80, 70);
        strokeWeight(count);
        for (j = 2; j < lineStartX.length; j++) {
          //index starts at two to avoid the line that goes from 0,0 to finger kp

          //realized drawing geometry must be fast in order for anything p5 to run well so 120*symmetry line() calls should not be something to be scared of, stacked these up to allow for more lines drawn before the clear
          //this is also synced to tempo -- not super well quantized but approximately every second there is a clear/restart
          line(lineStartX[j], lineStartY[j], lineEndX[j], lineEndY[j]);
        }
        // ... and reflect the line within the symmetry sections as well.
        push();
        scale(1, -1);
       // line(lineStartX, lineStartY, lineEndX, lineEndY);
        for (j = 2; j < lineStartX.length; j++) {
          line(lineStartX[j], lineStartY[j], lineEndX[j], lineEndY[j]);
        }
        pop();
      }
    }
  }
  gl.enable(gl.DEPTH_TEST);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (keyCode == 32) {
    clear();
    background(50);
  }
}
// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/