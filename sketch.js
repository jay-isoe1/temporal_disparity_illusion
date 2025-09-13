// === Global State ===
let circles = [];
let selectedCircle = null;

let clickThreshold = 25;
let shadowOffset = 2;
let rx = 16, ry = 16;

let isBackgroundFading = false;
let backgroundValue = 0;
let fadeDirection = 1;
let bgFadeSpeed = 1;

let isWaveMode = true;

let useFixedColor = false;
let fixedL = 60, fixedTheta = 180, fixedChroma = 100;

const spiralModes = ["Linear", "Golden", "Double", "Wave"];
let spiralModeIndex = 0;

const shapeNames = ["Droplet", "Ellipse", "Circle", "Diamond", "Star", "Petal"];
let shapeIndex = -1; // -1 = All

const shadowModes = ["Horizontal (Y)", "Angular", "Rotation-Based", "Wave"];
let shadowModeIndex = 0;

let angleStepBase = 2.5;
let radiusStepBase = 0.9;
let totalShapes = 324;

let shadowShiftPhase = 1.0;
let shadowShiftSpeed = 0.05;
let shadowDirectionIncreasing = true;

function setup() {
  const cnv = createCanvas(1000, 600)
  cnv.parent('canvas-wrap')
  createCanvas(1500, 800);
  pixelDensity(1);
  smooth();
  generateCircles();
}

function draw() {
  if (isBackgroundFading) {
    backgroundValue += fadeDirection * bgFadeSpeed;
    if (backgroundValue > 255 || backgroundValue < 0) {
      fadeDirection *= -1;
      backgroundValue = constrain(backgroundValue, 0, 255);
      shadowDirectionIncreasing = !shadowDirectionIncreasing;
    }
  }

  // shadowShiftPhase: -1 ~ 1
  shadowShiftPhase = lerp(
    shadowShiftPhase,
    shadowDirectionIncreasing ? 1.0 : -1.0,
    shadowShiftSpeed
  );

  background(backgroundValue);
  noStroke();
  for (const c of circles) {
    c.display();
  }
}

function mousePressed() {
  selectedCircle = null;
  for (const c of circles) {
    if (dist(mouseX, mouseY, c.x, c.y) < clickThreshold) {
      selectedCircle = c;
      break;
    }
  }
}

function generateCircles() {
  spiralModeIndex  = Number(spiralModeIndex);
  shadowModeIndex = Number(shadowModeIndex);
  if (shadowModeIndex < 0 || shadowModeIndex > 3) shadowModeIndex = 0;
  shapeIndex       = Number(shapeIndex);

  circles.length = 0;

  const centerX = width / 2;
  const centerY = height / 2;
  const types = (shapeIndex === -1 || !shapeNames[shapeIndex])
  ? shapeNames
  : [shapeNames[shapeIndex]];
  const startRadius = 30;

  const cols = int(sqrt(totalShapes));
  const rows = int(ceil(totalShapes / cols));
  const dx = 36;
  const dy = 42;

  const waveAmp = 30;
  const k = TWO_PI * 4.0 / cols;

  const xs = new Array(totalShapes);
  const ys = new Array(totalShapes);

  for (let i = 0; i < totalShapes; i++) {
    const angle = i * angleStepBase;
    const radius = startRadius + i * radiusStepBase;
    let x = 0;
    let y = 0;

    if (spiralModeIndex === 3) {
      const col = i % cols;
      const row = floor(i / cols);
      const phase = k * col;
      const yOffset = sin(phase) * waveAmp;
      const baseY = centerY + row * dy - (rows - 1) * dy / 2;
      y = baseY + yOffset;
      x = centerX + col * dx - (cols - 1) * dx / 2;
    } else if (spiralModeIndex === 0) {
      x = centerX + radius * cos(angle);
      y = centerY + radius * sin(angle);
    } else if (spiralModeIndex === 1) {
      const goldenAngle = i * radians(137.5);
      const goldenRadius = startRadius + i * 1.5;
      x = centerX + goldenRadius * cos(goldenAngle);
      y = centerY + goldenRadius * sin(goldenAngle);
    } else if (spiralModeIndex === 2) {
      const dir = (i % 2 === 0) ? 1 : -1;
      const doubleAngle = i * angleStepBase * dir;
      const doubleRadius = startRadius + i * radiusStepBase;
      x = centerX + doubleRadius * cos(doubleAngle);
      y = centerY + doubleRadius * sin(doubleAngle);
    }

    xs[i] = x;
    ys[i] = y;
  }

  const isShadowInverted = (fadeDirection < 0);

  for (let i = 0; i < totalShapes; i++) {
    const x = xs[i];
    const y = ys[i];
    const angle = i * angleStepBase;
    let rotAngle = 0;
    let dynamicRx = rx;
    let dynamicRy = ry;

    const col = i % cols;

    if (spiralModeIndex === 3) {
      rotAngle = 0;
    } else if (spiralModeIndex === 0) {
      rotAngle = isWaveMode ? angle : 0;
      const s = map(30 + i * radiusStepBase, 30, 30 + totalShapes * radiusStepBase, 0.4, 1.0);
      dynamicRx = rx * s;
      dynamicRy = ry * s;
    } else if (spiralModeIndex === 1) {
      const gAng = i * radians(137.5);
      rotAngle = isWaveMode ? gAng : 0;
      const gRad = 30 + i * 1.5;
      const s = map(gRad, 30, 30 + totalShapes * 1.5, 0.4, 1.0);
      dynamicRx = rx * s;
      dynamicRy = ry * s;
    } else if (spiralModeIndex === 2) {
      const dir = (i % 2 === 0) ? 1 : -1;
      const dAng = i * angleStepBase * dir;
      rotAngle = isWaveMode ? dAng : 0;
      const dRad = 30 + i * radiusStepBase;
      const s = map(dRad, 30, 30 + totalShapes * radiusStepBase, 0.4, 1.0);
      dynamicRx = rx * s;
      dynamicRy = ry * s;
    }

    // shadow color + transition
    let leftShadowColor = color(0);
    let rightShadowColor = color(255);
    
    if (shadowModeIndex === 0) {            // Horizontal (Y)
      const above = y < height / 2;
      leftShadowColor  = (above !== isShadowInverted) ? color(0) : color(255);
      rightShadowColor = (above !== isShadowInverted) ? color(255) : color(0);
    } else if (shadowModeIndex === 1) {     // Angular
      const angCond = (angle % TWO_PI) < PI;
      leftShadowColor  = (angCond !== isShadowInverted) ? color(0) : color(255);
      rightShadowColor = (angCond !== isShadowInverted) ? color(255) : color(0);
    } else if (shadowModeIndex === 2) {     // Rotation-Based
      const cosCond = cos(angle) > 0;
      leftShadowColor  = (cosCond !== isShadowInverted) ? color(0) : color(255);
      rightShadowColor = (cosCond !== isShadowInverted) ? color(255) : color(0);
    } else if (shadowModeIndex === 3) {     // Wave (배경 페이드 기반)
      leftShadowColor  = isShadowInverted ? color(255) : color(0);
      rightShadowColor = isShadowInverted ? color(0) : color(255);
    }
    

    const shapeType = types[i % types.length];
    let L;

    if (useFixedColor) {
      L = fixedL;
    } else if (spiralModeIndex === 3) {
      const t = map(col, 0, cols - 1, 0, 1);
      L = (t < 0.25) ? 30 : (t < 0.50) ? 50 : (t < 0.75) ? 70 : 90;
    } else {
      if (i < totalShapes / 4) {
        L = 30;
      } else if (i < totalShapes / 2) {
        L = 50;
      } else if (i < 3 * totalShapes / 4) {
        L = 70;
      } else {
        L = 90;
      }
    }

    const hueDeg  = useFixedColor ? fixedTheta  : random(360);
    const chromaV = useFixedColor ? fixedChroma : 100;

    circles.push(new CieShape(
      x, y, dynamicRx, dynamicRy, L, chromaV, hueDeg,
      rotAngle, shapeType, leftShadowColor, rightShadowColor
    ));
  }
} 

// === Class ===
class CieShape {
  constructor(x, y, rx, ry, L, chroma, hueDeg, angle, shapeType, leftShadowColor, rightShadowColor) {
    this.x = x; this.y = y;
    this.rx = rx; this.ry = ry;
    this.L = L; this.chroma = chroma; this.hueDeg = hueDeg;
    this.angle = angle; this.shapeType = shapeType;
    this.leftShadowColor = leftShadowColor || color(0);
    this.rightShadowColor = rightShadowColor || color(255);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    const fillCol = labColor(this.L, this.chroma, this.hueDeg); // LCh 근사
    noStroke();

    const leftOffset  = -shadowOffset * shadowShiftPhase;
    const rightOffset =  shadowOffset * shadowShiftPhase;

    if (this.shapeType === "Ellipse") {
      drawEllipse(leftOffset, 0, this.rx*1.5, this.ry*2, this.leftShadowColor);
      drawEllipse(rightOffset,0, this.rx*1.5, this.ry*2, this.rightShadowColor);
      drawEllipse(0,0, this.rx*1.5, this.ry*2, fillCol);

    } else if (this.shapeType === "Circle") {
      const r = min(this.rx, this.ry) * 1.2;
      fill(this.leftShadowColor);  ellipse(leftOffset, 0, r, r);
      fill(this.rightShadowColor); ellipse(rightOffset,0, r, r);
      fill(fillCol);               ellipse(0, 0, r, r);

    } else if (this.shapeType === "Droplet") {
      drawDroplet(0, leftOffset,  this.rx*1.5, this.ry*2.2, this.leftShadowColor);
      drawDroplet(0, rightOffset, this.rx*1.5, this.ry*2.2, this.rightShadowColor);
      drawDroplet(0, 0,           this.rx*1.5, this.ry*2.2, fillCol);

    } else if (this.shapeType === "Diamond") {
      drawDiamond(leftOffset,  0, this.rx*2, this.ry*2, this.leftShadowColor);
      drawDiamond(rightOffset, 0, this.rx*2, this.ry*2, this.rightShadowColor);
      drawDiamond(0,           0, this.rx*2, this.ry*2, fillCol);

    } else if (this.shapeType === "Star") {
      drawStar(leftOffset,  0, this.rx*0.5, this.ry, 5, this.leftShadowColor);
      drawStar(rightOffset, 0, this.rx*0.5, this.ry, 5, this.rightShadowColor);
      drawStar(0,           0, this.rx*0.5, this.ry, 5, fillCol);

    } else if (this.shapeType === "Petal") {
      drawPetal(0, leftOffset,  this.rx*1.5, this.ry*1.5, this.leftShadowColor);
      drawPetal(0, rightOffset, this.rx*1.5, this.ry*1.5, this.rightShadowColor);
      drawPetal(0, 0,           this.rx*1.5, this.ry*1.5, fillCol);
    }
    pop();
  }
}

// === Draw helpers ===
function drawEllipse(x, y, w, h, col) {
  push(); translate(x,y); fill(col); ellipse(0,0,w,h); pop();
}
function drawDiamond(x, y, w, h, col){
  push(); translate(x,y); fill(col);
  beginShape();
  vertex(0,-h/2); vertex(w/2,0); vertex(0,h/2); vertex(-w/2,0);
  endShape(CLOSE); pop();
}
function drawStar(x,y,innerR,outerR,n, col){
  push(); translate(x,y); fill(col); beginShape();
  for(let i=0;i<n*2;i++){ let ang=PI*i/n; let r=(i%2===0)?outerR:innerR; vertex(cos(ang)*r,sin(ang)*r); }
  endShape(CLOSE); pop();
}
function drawDroplet(x,y,w,h,col){
  push(); translate(x,y); fill(col); beginShape();
  vertex(0,-h/2);
  bezierVertex(w/2,-h/2, w/2,h/6, 0,h/2);
  bezierVertex(-w/2,h/6, -w/2,-h/2, 0,-h/2);
  endShape(CLOSE); pop();
}
function drawPetal(x,y,w,h,col){
  push(); translate(x,y); fill(col); beginShape();
  vertex(0,0);
  bezierVertex(w/2,-h/2, w/2,h/2, 0,h);
  bezierVertex(-w/2,h/2, -w/2,-h/2, 0,0);
  endShape(CLOSE); pop();
}

// === Color: LCh -> RGB ===
function labColor(L, C, Hdeg) {
  // 1) LCh → Lab
  const h = (Hdeg % 360) * Math.PI / 180;
  let a = C * Math.cos(h);
  let b = C * Math.sin(h);

  // 2) Lab → XYZ (D65)
  // Constants
  const epsilon = 216 / 24389;   // ≈ 0.008856
  const kappa   = 24389 / 27;    // ≈ 903.3
  const Xn = 95.047, Yn = 100.0, Zn = 108.883; // D65 reference white

  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const fx3 = fx * fx * fx;
  const fy3 = fy * fy * fy;
  const fz3 = fz * fz * fz;

  const xr = (fx3 > epsilon) ? fx3 : (116 * fx - 16) / kappa;
  const yr = (L > kappa * epsilon) ? fy3 : L / kappa;
  const zr = (fz3 > epsilon) ? fz3 : (116 * fz - 16) / kappa;

  let X = Xn * xr;
  let Y = Yn * yr;
  let Z = Zn * zr;

  // 3) XYZ → linear sRGB
  X /= 100; Y /= 100; Z /= 100;  // normalize
  let Rl =  3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let Gl = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let Bl =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;

  // gamut clipping
  let tries = 0;
  while ((Rl < 0 || Rl > 1 || Gl < 0 || Gl > 1 || Bl < 0 || Bl > 1) && C > 0 && tries < 5) {
    C *= 0.85;
    a = C * Math.cos(h);
    b = C * Math.sin(h);

    const fx2 = a / 500 + fy;
    const fz2 = fy - b / 200;
    const fx23 = fx2 * fx2 * fx2;
    const fz23 = fz2 * fz2 * fz2;

    const xr2 = (fx23 > epsilon) ? fx23 : (116 * fx2 - 16) / kappa;
    const yr2 = yr; // L은 동일
    const zr2 = (fz23 > epsilon) ? fz23 : (116 * fz2 - 16) / kappa;

    X = Xn * xr2; Y = Yn * yr2; Z = Zn * zr2;
    X /= 100; Y /= 100; Z /= 100;

    Rl =  3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    Gl = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    Bl =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;

    tries++;
  }

  // 4) sRGB GAMMA
  function gamma(u) {
    return (u <= 0.0031308) ? 12.92 * u : 1.055 * Math.pow(u, 1/2.4) - 0.055;
  }

  let R = gamma(Math.max(0, Math.min(1, Rl)));
  let G = gamma(Math.max(0, Math.min(1, Gl)));
  let B = gamma(Math.max(0, Math.min(1, Bl)));

  // p5.Color 
  const r255 = Math.round(R * 255);
  const g255 = Math.round(G * 255);
  const b255 = Math.round(B * 255);

  // 
  push();
  colorMode(RGB, 255);
  const c = color(r255, g255, b255);
  pop();
  return c;
}

function mouseWheel(e) {
  const dy = (typeof e.delta === 'number') ? e.delta : (e.deltaY || 0);

  // 스텝 크기: Shift로 가속
  const stepA = keyIsDown(SHIFT) ? 0.5 : 0.1;
  const stepR = keyIsDown(SHIFT) ? 0.2 : 0.05;

  if (keyIsDown(ALT)) {
    // ALT: radiusStepBase 조절 (선택)
    if (dy < 0) radiusStepBase = Math.min(3.0, radiusStepBase + stepR);
    else        radiusStepBase = Math.max(1.0, radiusStepBase - stepR);

    UI.radiusStepBase = radiusStepBase;
    if (typeof ctrlRadius?.updateDisplay === 'function') ctrlRadius.updateDisplay();
  } else {
    // 기본: angleStepBase 조절
    if (dy < 0) angleStepBase = Math.min(6.0, angleStepBase + stepA);
    else        angleStepBase = Math.max(1.5, angleStepBase - stepA);

    UI.angleStepBase = angleStepBase;
    if (typeof ctrlAngle?.updateDisplay === 'function') ctrlAngle.updateDisplay();
  }

  generateCircles();
  return false; // prevent page scroll 
}




const UI = {
  spiralModeIndex: 0,
  shapeIndex: -1,
  shadowModeIndex: 0,
  totalShapes: 324,
  angleStepBase: 2.5,
  radiusStepBase: 0.9,
  useFixedColor: false,
  fixedL: 60,
  fixedTheta: 180,
  fixedChroma: 100,
  isBackgroundFading: false,
  bgFadeSpeed: 1
}; 


 // --- dat.GUI ---
const gui = new dat.GUI();

const ctrlSpiral = gui.add(UI, 'spiralModeIndex', { Linear: 0, Golden: 1, Double: 2, Wave: 3 })
  .onChange(v => { spiralModeIndex = Number(v); generateCircles(); });

const ctrlShape = gui.add(UI, 'shapeIndex', -1, 5, 1).name('shapeIndex (-1=All)')
  .onChange(v => { shapeIndex = Number(v); generateCircles(); });

const ctrlShadow = gui.add(UI, 'shadowModeIndex', { Horizontal: 0, Angular: 1, Rotation: 2, Wave: 3 })
  .onChange(v => { shadowModeIndex = Number(v); generateCircles(); });

// 👉 컨트롤러 참조 저장 (휠로 값 바꿀 때 표시를 갱신하기 위함)
const ctrlTotal   = gui.add(UI, 'totalShapes', 36, 800, 1)
  .onFinishChange(v => { totalShapes = v; generateCircles(); });

const ctrlAngle   = gui.add(UI, 'angleStepBase', 1.5, 6.0, 0.1)
  .onFinishChange(v => { angleStepBase = v; generateCircles(); });

const ctrlRadius  = gui.add(UI, 'radiusStepBase', 1.0, 3.0, 0.1)
  .onFinishChange(v => { radiusStepBase = v; generateCircles(); });

gui.add(UI, 'useFixedColor')
  .onChange(v => { useFixedColor = v; });

gui.add(UI, 'fixedL', 0, 100, 1)
  .onChange(v => { fixedL = v; });

gui.add(UI, 'fixedTheta', 0, 360, 1)
  .onChange(v => { fixedTheta = v; });

gui.add(UI, 'fixedChroma', 0, 100, 1)
  .onChange(v => { fixedChroma = v; });

gui.add(UI, 'isBackgroundFading')
  .onChange(v => { isBackgroundFading = v; });

gui.add(UI, 'bgFadeSpeed', 0, 10, 0.1)
  .onChange(v => { bgFadeSpeed = v; });
