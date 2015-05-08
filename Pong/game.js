///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //

// TODO: DECLARE and INTIALIZE your constants here
var START_TIME = currentTime();

var START = 0;
var GAME  = 1;
var GAME_OVER = 2;
var paddles;
var ball;
var gameState
var keysDown = {}
var lastAIChangeTime
var SPEEDUNIT = screenWidth / 100;
// When setup happens...
function onSetup() {
    gameState = START
    lastAIChangeTime = currentTime();
    paddles = [{
        x : screenWidth / 8,
        y : screenHeight / 2,
        w : screenWidth / 45,
        h : screenHeight / 6,
        v : {x : 0, y: 0},
        score : 0,
        lastpositions : []
    },
    {
        x : screenWidth - (screenWidth / 8),
        y : screenHeight / 2,
        w : screenWidth / 45,
        h : screenHeight / 6,
        v : {x : 0, y: 0},
        score : 0,
        lastpositions : []
    }]
    ball = newBall()
}

function newBall() {
    return { x : screenWidth / 2,
    y : screenHeight / 2,
    w : screenWidth / 64,
    h : screenHeight / 64,
    v : randomDir(),
    lastpositions : [] }
}

// When a key is pushed
function onKeyStart(key) {
    if (gameState === START) {
        gameState = GAME
    }
    if (asciiCharacter(key) === 'W') {
        paddles[0].v = {y: -1.75 * SPEEDUNIT, x: 0}
    } else if (asciiCharacter(key) === 'S') {
        paddles[0].v = {y: 1.75 * SPEEDUNIT, x: 0}
    }
    keysDown[key] = true;
}

function onKeyEnd(key) {
    keysDown[key] = false;
    paddles[0].v = {x: 0, y: 0}
    if (keysDown[asciiCode('S')]) {
        onKeyStart(asciiCode('S'));
    } else if (keysDown[asciiCode('W')]) {
        onKeyStart(asciiCode('W'))
    }
}

function gameObjects() {
    return [ball, paddles[0], paddles[1]];
}

function magnitude(v) {
    return Math.sqrt(squareMagnitude(v));
}
function squareMagnitude(v) {
    return v.x * v.x + v.y * v.y;
}
function normalize(v) {
    return scale(v, 1.0 / magnitude(v))
}
function scale(v, a) {
    return {x: v.x * a, y: v.y * a}
}
function randomDir() {
    return scale(normalize({x: (Math.random() - .5), y: (Math.random() - .5)}), SPEEDUNIT);
}
function dot(v, w) {
    return v.x * w.x + v.y * w.y;
}
function rotate(v, theta) {
    return {x: v.x * Math.cos(theta) - v.y * Math.sin(theta),
            y: v.x * Math.sin(theta) + v.y * Math.cos(theta)}
}

function clampPositionToScreen(obj) {
    obj.x = Math.min(Math.max(0, obj.x), screenWidth - obj.w);
    obj.y = Math.min(Math.max(0, obj.y), screenHeight - obj.h);
}

function applyVelocities() {
    var objs = gameObjects();
    for (var i = 0; i < objs.length; ++i) {
        objs[i].lastpositions.push({x: objs[i].x, y: objs[i].y})
        if (objs[i].lastpositions.length > 5) {
            objs[i].lastpositions.shift()
        }
        objs[i].x += objs[i].v.x;
        objs[i].y += objs[i].v.y;
        clampPositionToScreen(objs[i]);
    }
}
function drawLine() {
    fillRectangle(screenWidth/2, 0, screenWidth/64, screenHeight, makeColor(0.8, 0.8, 0.8));
}

function drawObject(obj) {
    for (var i = 0; i < obj.lastpositions.length; ++i) {
        var a = 1 - .2 * (obj.lastpositions.length - i);
        fillRectangle(obj.lastpositions[i].x, obj.lastpositions[i].y, obj.w, obj.h, makeColor(a, a, a, 1));
    }
    fillRectangle(obj.x, obj.y, obj.w, obj.h, makeColor(1, 1, 1, 1))
    strokeRectangle(obj.x, obj.y, obj.w, obj.h, makeColor(0, 0, 0, 1), 2)
}

function drawGameObjects() {
    var objs = gameObjects();
    for (var i = 0; i < objs.length; ++i) {
        drawObject(objs[i])
    }
}
function sign(x) {
    return x > 0 ? 1 : -1
}
function bounce(v) {
    var m = Math.min(magnitude(ball.v), SPEEDUNIT*1.5)
    return scale(normalize({x : sign(v.x) * Math.abs(v.y), y: -sign(v.y) * Math.abs(v.x) }), 1.1 * m)
}
function gameLogic() {
    if (ball.x <= 0) {
        paddles[1].score ++
        ball = newBall()
    } else if (ball.x + ball.w >= screenWidth) {
        paddles[0].score ++
        ball = newBall()
    } else if (ball.y <= 0 || ball.y + ball.h >= screenHeight) {
        ball.v = bounce(ball.v);
    } else {
        for (var i = 0; i < paddles.length; ++i) {
            if (ball.x > paddles[i].x && ball.x < paddles[i].x + paddles[i].w && ball.y > paddles[i].y && ball.y < paddles[i].y + paddles[i].h) {
                var k = 3.14 / 2 * (paddles[i].y + paddles[i].h  - ball.y) / (paddles[i].h * 2)
                var m = Math.min(magnitude(ball.v), SPEEDUNIT*1.5)
                ball.v = scale(normalize({x: SPEEDUNIT * Math.cos(k) * (i == 0? 1 : -1),
                          y: SPEEDUNIT * -Math.sin(k)}), 1.05 * m)
            }
        }
    }

    if (ball.x < screenWidth/2) {
        paddles[1].v = {x: 0, y: 0}
    } else if (ball.y >= paddles[1].y) {
        paddles[1].v = {x: 0, y: 1.5 * SPEEDUNIT}
    } else {
        paddles[1].v = {x: 0, y: -1.5* SPEEDUNIT}
    }
}
function drawScore() {
    fillText(paddles[0].score,
             screenWidth / 3,
             screenHeight / 5,
             makeColor(1, 1, 1.0, 1.0),
             "300px Times New Roman",
             "center",
             "middle");
     fillText(paddles[1].score,
              screenWidth / 3 * 2,
              screenHeight / 5,
              makeColor(1, 1, 1.0, 1.0),
              "300px Times New Roman",
              "center",
              "middle");
    if (paddles[0].score > 9 || paddles[1].score > 9) {
        gameState = GAME_OVER
    }
}

// Called 30 times or more per second
function onTick() {
    // Some sample drawing

    clearRectangle(0, 0, screenWidth, screenHeight);

    if (gameState === START) {
        fillText("Pong",
                 screenWidth / 2,
                 screenHeight / 2,
                 makeColor(1, 1.0, 1.0, 1.0),
                 "300px Times New Roman",
                 "center",
                 "middle");
    } else if (gameState === GAME) {
        gameLogic();
        applyVelocities();
        drawLine();

        drawGameObjects();
        drawScore();
    } else if (gameState === GAME_OVER) {
        fillText("You " + (paddles[0].score > 9 ? "Won" : "Lost"),
                 screenWidth / 2,
                 screenHeight / 2,
                 makeColor(1, 1.0, 1.0, 1.0),
                 "300px Times New Roman",
                 "center",
                 "middle");
    }

}
