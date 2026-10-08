
let video;
let faceMesh;
let faces = [];

let faceImg;
let irisImg;
let blinkImg;
let eyebrowImg;
let reflectionImg;

let eyeX = 0;
let eyeY = 0;

// 眼球中心，沿用之前调好的位置
let leftEyeX = 218;
let leftEyeY = 152;
let rightEyeX = 488;
let rightEyeY = 152;

let trackingEnabled = true;

// 眨眼设置
let blinking = false;
let blinkStart = 0;
let nextBlink = 0;
let blinkDuration = 180;

// 眉毛微表情
let browOffset = 0;
let targetBrowOffset = 0;

// 素材原始坐标
const IRIS_SOURCE_X = 187;
const IRIS_SOURCE_Y = 123;
const IRIS_SOURCE_W = 62;
const IRIS_SOURCE_H = 64;

// 原图中的高光中心
const REFLECTION_LEFT_X = 213;
const REFLECTION_RIGHT_X = 495;
const REFLECTION_Y = 155;

function preload() {
  faceMesh = ml5.faceMesh({
    maxFaces: 1
  });

  faceImg = loadImage("face.png");
  irisImg = loadImage("eye-left.png");
  blinkImg = loadImage("blink.png");
  eyebrowImg = loadImage("eyebrows.png");
  reflectionImg = loadImage("reflections.png");
}

function setup() {
  createCanvas(720, 277);
  imageMode(CORNER);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  nextBlink = millis() + random(2500, 5500);
}

function draw() {
  background(255);

  let targetX = 0;
  let targetY = 0;

  // 摄像头追踪
  if (trackingEnabled && faces.length > 0) {
    let face = faces[0];

    let faceX =
      face.box.xMin + face.box.width / 2;
    let faceY =
      face.box.yMin + face.box.height / 2;

    targetX = map(
      faceX, 0, 640, -20, 20
    );

    targetY = map(
      faceY, 0, 480, -10, 10
    );
  }

  targetX = constrain(targetX, -20, 20);
  targetY = constrain(targetY, -8, 7);

  eyeX = lerp(eyeX, targetX, 0.12);
  eyeY = lerp(eyeY, targetY, 0.12);

  // 眨眼控制
  if (!blinking && millis() > nextBlink) {
    blinking = true;
    blinkStart = millis();
  }

  if (
    blinking &&
    millis() - blinkStart > blinkDuration
  ) {
    blinking = false;
    nextBlink =
      millis() + random(2500, 6000);
  }

  // 眉毛微表情
  if (frameCount % 150 === 0) {
    targetBrowOffset = random(-2, 2);
  }

  browOffset = lerp(
    browOffset,
    targetBrowOffset,
    0.025
  );

  // 绘制脸部
  image(faceImg, 0, 0, 720, 277);

  if (!blinking) {
    // 左眼
    drawMaskedEye(
      leftEyeX,
      leftEyeY,
      REFLECTION_LEFT_X
    );

    // 右眼
    drawMaskedEye(
      rightEyeX,
      rightEyeY,
      REFLECTION_RIGHT_X
    );
  } else {
    // 闭眼素材
    image(blinkImg, 0, 0, 720, 277);
  }

  // 眉毛微表情
  image(
    eyebrowImg,
    0,
    browOffset,
    720,
    277
  );
}

// 绘制眼球和原始高光
function drawMaskedEye(x, y, reflectionX) {
  let ctx = drawingContext;

  ctx.save();
  ctx.beginPath();

  // 眼眶遮罩
  ctx.moveTo(x - 66, y);

  // 上眼睑
  ctx.bezierCurveTo(
    x - 38, y - 38,
    x + 32, y - 38,
    x + 66, y
  );

  // 下眼睑
  ctx.bezierCurveTo(
    x + 35, y + 48,
    x - 36, y + 48,
    x - 66, y
  );

  ctx.closePath();
  ctx.clip();

  // 眼球左上角位置
  let irisLeft =
    x + eyeX - IRIS_SOURCE_W / 2;

  let irisTop =
    y + eyeY - IRIS_SOURCE_H / 2;

  // 从原始图片中裁切虹膜
  image(
    irisImg,
    irisLeft,
    irisTop,
    IRIS_SOURCE_W,
    IRIS_SOURCE_H,
    IRIS_SOURCE_X,
    IRIS_SOURCE_Y,
    IRIS_SOURCE_W,
    IRIS_SOURCE_H
  );

  // 从原始高光图提取对应区域
  // 两眼高光分别跟随虹膜移动
  let reflectionSourceLeft =
    reflectionX - 16;

  let reflectionSourceTop =
    REFLECTION_Y - 32;

  image(
    reflectionImg,
    irisLeft,
    irisTop,
    32,
    64,
    reflectionSourceLeft,
    reflectionSourceTop,
    32,
    64
  );

  ctx.restore();
}

// 接收人脸识别结果
function gotFaces(results) {
  faces = results;
}
