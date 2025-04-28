// sketch.js
let bg, foxImg, bearImg, fishImg;
let fishPos = [];
let natureSound, glitchSound, eerieMusic;
let foxPos, bearPos, homePos;
let alertState = false;
let currentTarget = -1;
let gameStarted = false;
let containerDiv;
let sketchIsVisible = false;

const foxEase = 0.20;
const bearSpeed = 25;
const chaseRange = 150;
const catchRange = 80;

function preload() {
  bg = loadImage('forest.jpg');
  foxImg = loadImage('fox.png');
  bearImg = loadImage('bear.png');
  fishImg = loadImage('fish.png');
  soundFormats('mp3');
  natureSound = loadSound('nature.mp3');
  glitchSound = loadSound('glitch.mp3');
  eerieMusic = loadSound('eerie.mp3');
}

function setup() {
  // Setup container and canvas
  containerDiv = select('#sketch-container').elt;
  const w = containerDiv.offsetWidth;
  const h = containerDiv.offsetHeight;
  const canvas = createCanvas(w, h);
  canvas.parent('sketch-container');
  noCursor();
  imageMode(CENTER);

  // Resize sprites
  foxImg.resize(80, 0);
  bearImg.resize(120, 0);
  fishImg.resize(0, 100);

  // Initialize fish positions
  const fishCount = 5;
  const gap = width / (fishCount + 1);
  const fishY = height / 2;
  for (let i = 0; i < fishCount; i++) {
    fishPos.push(createVector(gap * (i + 1), fishY));
  }

  // Initial fox and bear positions
  foxPos = createVector(width / 2, height - foxImg.height / 2);
  do {
    bearPos = createVector(
      random(bearImg.width / 2, width - bearImg.width / 2),
      random(bearImg.height / 2, height - bearImg.height / 2)
    );
  } while (isOnFish(bearPos));
  homePos = bearPos.copy();

  // Start with noLoop to prevent running until visible
  noLoop();
  // Scroll listener to pause/reset when canvas fully out of view and resume when in view
  window.addEventListener('scroll', checkScroll);
  checkScroll();
}

function draw() {
  background(0);
  image(bg, width / 2, height / 2, width, height);

  if (!gameStarted) {
    // click-to-start overlay
    noStroke();
    fill(128, 150);
    rectMode(CORNER);
    rect(0, 0, width, height);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('Click to Start', width / 2, height / 2);
    return;
  }

  // Draw fish
  for (let pos of fishPos) {
    image(fishImg, pos.x, pos.y);
  }

  // Fox movement
  let mouseP = createVector(mouseX, mouseY);
  foxPos.lerp(mouseP, foxEase);
  foxPos.x = constrain(foxPos.x, foxImg.width / 2, width - foxImg.width / 2);
  foxPos.y = constrain(foxPos.y, foxImg.height / 2, height - foxImg.height / 2);
  image(foxImg, foxPos.x, foxPos.y);

  // Determine target
  currentTarget = -1;
  for (let i = 0; i < fishPos.length; i++) {
    if (foxPos.dist(fishPos[i]) < chaseRange) {
      currentTarget = i;
      break;
    }
  }

  // Check catch
  let caught = false;
  if (currentTarget !== -1 && bearPos.dist(fishPos[currentTarget]) < catchRange) {
    caught = true;
  }

  // Bear movement
  if (!caught) {
    if (currentTarget !== -1) {
      moveTowards(bearPos, fishPos[currentTarget], bearSpeed);
    } else {
      moveTowards(bearPos, homePos, bearSpeed);
    }
  }

  // Constrain and draw bear
  bearPos.x = constrain(bearPos.x, bearImg.width / 2, width - bearImg.width / 2);
  bearPos.y = constrain(bearPos.y, bearImg.height / 2, height - bearImg.height / 2);
  image(bearImg, bearPos.x, bearPos.y);

  // Alert logic
  if (caught && !alertState) {
    natureSound.pause();
    glitchSound.play();
    eerieMusic.loop();
    alertState = true;
  } else if (!caught && alertState) {
    glitchSound.stop();
    eerieMusic.stop();
    natureSound.loop();
    alertState = false;
  }

  if (alertState) {
    drawButton('Help Fish', bearPos.x, bearPos.y - bearImg.height / 2 - 20);
  }
}

function mousePressed() {
  if (!sketchIsVisible) return; // <--- Ignore clicks if not visible!

  if (!gameStarted) {
    gameStarted = true;
    natureSound.loop();
    return;
  }
  // Clicking bear retriggers glitch
  const halfW = bearImg.width / 2;
  const halfH = bearImg.height / 2;
  if (
    mouseX >= bearPos.x - halfW && mouseX <= bearPos.x + halfW &&
    mouseY >= bearPos.y - halfH && mouseY <= bearPos.y + halfH
  ) {
    glitchSound.play();
  }
}

function windowResized() {
  const w = containerDiv.offsetWidth;
  const h = containerDiv.offsetHeight;
  resizeCanvas(w, h);
}

function checkScroll() {
  const rect = containerDiv.getBoundingClientRect();
  const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  sketchIsVisible = isVisible;
  if (isVisible) {
    loop();  
  } else {
    resetSketch();
    noLoop(); 
  }
}

function resetSketch() {
  gameStarted = false;
  alertState = false;
  currentTarget = -1;
  foxPos.set(width / 2, height - foxImg.height / 2);
  bearPos = homePos.copy();
  natureSound.stop();
  glitchSound.stop();
  eerieMusic.stop();
}

function isOnFish(pos) {
  for (let f of fishPos) {
    if (pos.dist(f) < fishImg.width) return true;
  }
  return false;
}

function moveTowards(from, to, speed) {
  let dir = p5.Vector.sub(to, from);
  let d = dir.mag();
  if (d > speed) {
    dir.normalize().mult(speed);
    from.add(dir);
  } else {
    from.set(to);
  }
}

function drawButton(label, cx, cy) {
  textSize(24);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  fill(255);
  let tw = textWidth(label);
  let bw = tw + 20;
  let bh = 40;
  rect(cx, cy, bw, bh, 5);
  fill(0);
  text(label, cx, cy);
}
