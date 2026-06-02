// =============================================
// sketch1.js — your first source sketch
// Paste your source sketch code here and start hacking
// =============================================

// Define the global variables.
// The symmetry variable will define how many reflective sections the canvas
// is split into.
let symmetry = 6;
let handPose;
let hands = [];

// The angle button will calculate the angle at which each section is rotated.
let angle = 360 / symmetry;

function preload() {
  handPose = ml5.handPose();
}

function setup() {
  describe(
    `Dark grey canvas that reflects the lines drawn within it in ${symmetry} sections.`
  );
  createCanvas(720, 400);
  angleMode(DEGREES);
  colorMode(HSB);
  background(50);
  let video = createCapture(VIDEO);
  video.hide();
  handPose.detectStart(video, function (results) {
    hands = results;
  });
}

let hue = 0;
let keyPointsX = [];
let keyPointsY = [];
let count = 0;

function draw() {
  // Move the 0,0 coordinates of the canvas to the center, instead of in
  // the top left corner.
  translate(width / 2, height / 2);

  // If the cursor is within the limits of the canvas...
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Translate the current position and the previous position of the
    // cursor to the new coordinates set with the translate() function above.
    let lineStartX = mouseX - width / 2;
    let lineStartY = mouseY - height / 2;
    let lineEndX = pmouseX - width / 2;
    let lineEndY = pmouseY - height / 2;

    let oldR = random(0, 255)
    let newR = random(0, 255)
    count++;
    console.log(count);

    for (let hand of hands) {
        for (let kp of hand.keypoints) {
            fill(100, 0 , 0);
            noStroke();
            circle(kp.x, kp.y, 10);
            //console.log(count);
            //console.log(keyPointsX);
            //console.log(keyPointsY);
          if (count%21 == 1) {
            keyPointsX.length = 0;
            keyPointsY.length = 0;
          }
          keyPointsX.push(kp.x);
          keyPointsY.push(kp.y);
        }

        avgX = keyPointsX/keyPointsX.length;
        avgY = keyPointsY/keyPointsY.length;

        console.log(avgX);
        console.log(avgY);
      }

    // And, if the mouse is pressed while in the canvas...
    if (mouseIsPressed === true) {
      // For every reflective section the canvas is split into, draw the cursor's
      // coordinates while pressed...
      hue = hue + 2;


      

      for (let i = 0; i < symmetry; i++) {
        rotate(angle);
        stroke(hue % 360, 80, 70);
        strokeWeight(2);
        line(lineStartX, lineStartY, lineEndX, lineEndY);

        // ... and reflect the line within the symmetry sections as well.
        push();
        scale(1, -1);
        line(lineStartX, lineStartY, lineEndX, lineEndY);
        pop();
      }
    }
  }
}

function keyPressed() {
  if (keyCode == 32) {
    clear();
    background(50);
  }
}