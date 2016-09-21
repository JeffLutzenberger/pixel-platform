'use strict';

var Profiler = function () {
    this.bufferFront = 0;
    this.bufferSize = 200;
    this.buffer = Array(this.bufferSize).fill(0);
    this.sampleCount = 0;
    this.sampleRate = 10;
    this.target = 100;
};

Profiler.prototype = {
    push : function (val) {
        this.buffer[this.bufferFront] = val;
        this.bufferFront += 1;
        this.bufferFront %= this.bufferSize;
    },

    record : function (val) {
        this.sampleCount += 1;
        // record every n frames
        if (this.sampleCount > this.sampleRate) {
            this.sampleCount = 0;
            this.push(val);
        }
    },

    index : function(i) {
        return this.buffer[(i + this.bufferFront) % this.bufferSize];
    }
};

var Dude = function () {
    this.position = [100, 100];
    this.velocity = [0, 0];
    this.damping = [0.5, 0.5];
}

Dude.prototype = {
    move : function (dv) {
        this.velocity[0] += dv[0];
        this.velocity[1] += dv[1];
    },

    moveRight : function () {
        this.velocity[0] += 0.1;
    },

    moveLeft : function () {
        this.velocity[0] -= 0.1;
    },

    moveUp : function () {
        this.velocity[1] -= 0.1;
    },

    moveDown : function () {
        this.velocity[1] += 0.1;
    },

    update : function (dt) {
        this.position[0] += this.velocity[0] * dt;
        this.position[1] += this.velocity[1] * dt;
    }
};

var GameController = function (canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.clockrate = 10;
    this.dt = 0;
    this.currentTime = 0;
    this.lastTime = 0;
    this.interval = setInterval(this.update.bind(this), this.clockrate);
    this.profiler = new Profiler();
    this.profiler.target = 100;
    this.showConsole = false;
    this.paused = false;

    // game assets
    this.dude = new Dude();
};

GameController.prototype = {

    update: function () {
        // always calculate dt otherwise when we resume from pausing dt is really big
        this.currentTime = new Date().getTime();
        this.dt = this.currentTime - this.lastTime;
        this.lastTime = this.currentTime;

        if (this.paused) {
            return;
        }

        this.context.clearRect(0, 0, this.width, this.height);

        //profile
        this.profiler.record(1 / this.dt * 1000);
        if (this.showConsole) {
            this.drawFramerate();
        }

        // move the dude
        this.dude.update(this.dt);

        //draw the dude
        drawRectangle(this.context, this.dude.position[0], this.dude.position[1], 10, 10);
    },

    drawFramerate : function () {
        var xPosition = 0;
        var yPosition = this.height;
        var frameRate = 0;
        var frameRateDisplayScale = 0.25;
        var delta = this.width / this.profiler.bufferSize;
        this.context.strokeStyle = rgba([0, 255, 0], 0.5);
        for (var i = 0; i < this.profiler.buffer.length; i++) {
            frameRate = this.profiler.index(i);
            this.context.strokeStyle = rgba([0, 255, 0], 0.5);
            this.context.beginPath();
            this.context.lineWidth = delta - 2;
            this.context.moveTo(xPosition, yPosition);
            this.context.lineTo(xPosition, yPosition - Math.min(frameRate, this.profiler.target) * frameRateDisplayScale);
            this.context.stroke();
            if (frameRate > 0 && this.profiler.target - frameRate > 0) {
                this.context.strokeStyle = rgba([255, 0, 0], 0.5);
                this.context.beginPath();
                this.context.lineWidth = delta - 2;
                this.context.moveTo(xPosition, yPosition - frameRate * frameRateDisplayScale);
                this.context.lineTo(xPosition, yPosition - this.profiler.target * frameRateDisplayScale);
                this.context.stroke();
            }
            xPosition += delta;
        }
    },

    rightArrowPressed: function () {
        this.dude.moveRight();
    },

    leftArrowPressed: function () {
        this.dude.moveLeft();
    },

    upArrowPressed: function () {
        this.dude.moveUp();
    },

    downArrowPressed: function () {
        this.dude.moveDown();
    },

    toggleConsole: function() {
        this.showConsole = !this.showConsole;
    },

    togglePause: function () {
        this.paused = !this.paused;
        if (this.paused) {
            drawText(this.context, this.width * 0.5 - 20, this.height * 0.5 - 10, [255,255,255], 'Arial', 20, 'Paused');
        }
    },
};

function rgba (c, alpha = 1.0) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
}

function drawText (context, x, y, color, fontFamily, fontSize, str) {
    context.fillStyle = rgba(color);
    context.font = fontSize + 'px ' + fontFamily;
    context.fillText(str, x, y);
}

function drawRectangle (context, x, y, w, h, theta = 0, color = [255, 255, 255], alpha = 1.0) {
    var x1 = -w * 0.5, y1 = -h * 0.5,
        x2 =  w * 0.5, y2 = -h * 0.5,
        x3 =  w * 0.5, y3 = h * 0.5,
        x4 = -w * 0.5, y4 = h * 0.5;
    context.save();
    context.translate(x, y);
    context.rotate(-theta);
    context.fillStyle = rgba(color, alpha);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(x3, y3);
    context.lineTo(x4, y4);
    context.lineCap = 'square';
    context.fill();
    context.restore();
}


$(function () {
    var canvas = $('canvas')[0];
    var context = canvas.getContext('2d');
    context.fillStyle = context.strokeStyle = 'black';
    this.gameController = new GameController(canvas);
});

window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

document.onkeydown = function (event) {
    if (this.gameController.paused && event.key != 'p') {
        return;
    }
    switch (event.key) {
        case 'c':
            this.gameController.toggleConsole();
            break;
        case 'p':
            this.gameController.togglePause();
            break;
        case 'ArrowRight':
            this.gameController.rightArrowPressed();
            break;
        case 'ArrowLeft':
            this.gameController.leftArrowPressed();
            break;
        case 'ArrowUp':
            this.gameController.upArrowPressed();
            break;
        case 'ArrowDown':
            this.gameController.downArrowPressed();
            break;
        default:
            break;
    }
}
