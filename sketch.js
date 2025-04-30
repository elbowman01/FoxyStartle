// sketch.js
let bg, foxImg, bearImg, fishImg, flashImg;
let fishPos = [], foxPos, bearPos, homePos;
let natureSound, glitchSound, eerieMusic;
let gameStarted = false, alertState = false, currentTarget = -1;
let isFlashing = false, flashStartTime = 0;

const flashDuration = 200;
const foxEase = 0.2, bearSpeed = 30;
const chaseRange = 200, catchRange = 80;
let containerDiv;

function preload() {
  bg       = loadImage('forest.jpg');
  foxImg   = loadImage('fox.png');
  bearImg  = loadImage('bear.png');
  fishImg  = loadImage('fish.png');
  flashImg = loadImage('flash.jpg');
  soundFormats('mp3');
  natureSound = loadSound('nature.mp3');
  glitchSound = loadSound('glitch.mp3');
  eerieMusic  = loadSound('eerie.mp3');
}

function setup() {
  containerDiv = select('#sketch-container').elt;
  let cnv = createCanvas(containerDiv.offsetWidth, containerDiv.offsetHeight);
  cnv.parent('sketch-container');
  noCursor();
  imageMode(CENTER);

  // Resize sprites
  foxImg.resize(90,0);
  bearImg.resize(225,0);
  fishImg.resize(0,50);

  // Fish positions
  let gap = width / 6;
  for (let i = 1; i <= 5; i++) {
    fishPos.push(createVector(gap * i, height / 2));
  }

  // Initial positions
  foxPos = createVector(width/2, height - foxImg.height/2);
  do {
    bearPos = createVector(
      random(bearImg.width/2, width - bearImg.width/2),
      random(bearImg.height/2, height - bearImg.height/2)
    );
  } while (fishPos.some(f => bearPos.dist(f) < fishImg.width * 2));
  homePos = bearPos.copy();

  // Volumes
  natureSound.setVolume(0.3);
  glitchSound.setVolume(0.3);
  eerieMusic.setVolume(0.4);

  // Reset game on scroll away
  window.addEventListener('scroll', () => {
    const rect = containerDiv.getBoundingClientRect();
    // reset when not fully visible
    if (!(rect.top >= 0 && rect.bottom <= window.innerHeight)) {
      resetGame();
    }
  });
}

function draw() {
  background(0);
  image(bg, width/2, height/2, width, height);

  // Start overlay until click
  if (!gameStarted) {
    rectMode(CORNER); // ensure full-canvas
    noStroke();
    fill(0,150);
    rect(0,0,width,height);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text('Click to Start', width/2, height/2);
    return;
  }

  // Flash on catch
  if (isFlashing) {
    image(flashImg, width/2, height/2, width, height);
    if (millis() - flashStartTime > flashDuration) isFlashing = false;
    return;
  }

  // Draw fish
  fishPos.forEach(p => image(fishImg, p.x, p.y));

  // Fox movement
  let mp = createVector(mouseX, mouseY);
  foxPos.lerp(mp, foxEase);
  foxPos.x = constrain(foxPos.x, foxImg.width/2, width - foxImg.width/2);
  foxPos.y = constrain(foxPos.y, foxImg.height/2, height - foxImg.height/2);
  image(foxImg, foxPos.x, foxPos.y);

  // Determine target & caught
  currentTarget = fishPos.findIndex(f => foxPos.dist(f) < chaseRange);
  let caught = currentTarget !== -1 && bearPos.dist(fishPos[currentTarget]) < catchRange;

  // Bear movement
  if (!caught) {
    let tgt = currentTarget === -1 ? homePos : fishPos[currentTarget];
    moveTowards(bearPos, tgt, bearSpeed);
  }

  // Draw bear
  bearPos.x = constrain(bearPos.x, bearImg.width/2, width - bearImg.width/2);
  bearPos.y = constrain(bearPos.y, bearImg.height/2, height - bearImg.height/2);
  image(bearImg, bearPos.x, bearPos.y);

  // Catch logic & flash trigger
  if (caught && !alertState) {
    isFlashing = true;
    flashStartTime = millis();
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

  // Draw red Help Fish button when alert
  if (alertState) {
    textSize(24);
    textAlign(CENTER, CENTER);
    let label = 'Help Fish';
    let btnW = textWidth(label) + 20;
    let btnH = 40;
    rectMode(CENTER);
    fill(255,0,0);
    rect(bearPos.x, bearPos.y - bearImg.height/2 - 20, btnW, btnH, 5);
    fill(0);
    text(label, bearPos.x, bearPos.y - bearImg.height/2 - 20);
  }
}
function mousePressed(event) {
  // Only start when clicking inside the canvas
  const rect = containerDiv.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) {
    return;
  }
  if (!gameStarted) {
    gameStarted = true;
    natureSound.loop();
    return;
  }
  // GLitch on bear click
  let hw = bearImg.width/2, hh = bearImg.height/2;
  if (mouseX >= bearPos.x - hw && mouseX <= bearPos.x + hw &&
      mouseY >= bearPos.y - hh && mouseY <= bearPos.y + hh) {
    glitchSound.play();
  }
}

function resetGame() {
  gameStarted = false;
  alertState = false;
  isFlashing = false;
  currentTarget = -1;
  foxPos.set(width/2, height - foxImg.height/2);
  bearPos.set(homePos.x, homePos.y);
  natureSound.stop();
  glitchSound.stop();
  eerieMusic.stop();
}

function moveTowards(from, to, s) {
  let dir = p5.Vector.sub(to, from), d = dir.mag();
  if (d > s) from.add(dir.normalize().mult(s)); else from.set(to);
}
