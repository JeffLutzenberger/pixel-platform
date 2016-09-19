'use strict';

var Profiler = function () {
    this.bufferFront = 0;
    this.bufferSize = 200;
    this.buffer = Array(this.bufferSize).fill(0);
    this.sampleCount = 0;
    this.sampleRate = 10;
    this.target = 100;
}

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
    indexAt : function(i) {
        return this.buffer[(i + this.bufferFront) % this.bufferSize];
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
    this.showConsole = false;
};

GameController.prototype = {

    update: function () {
        this.context.clearRect(0, 0, this.width, this.height);
        this.currentTime = new Date().getTime();
        this.dt = this.currentTime - this.lastTime;
        this.lastTime = this.currentTime;
        drawText(this.context, 100, 100, [0,0,0], 'Arial', 20, 'testing');
        if (this.showConsole) {
            this.profiler.record(1 / this.dt * 1000);
            this.drawFramerate();
        }
    },

    drawFramerate : function () {
        var xPosition = 0;
        var yPosition = this.height;
        var frameRate = 0;
        var frameRateDisplayScale = 0.25;
        var delta = this.width / this.profiler.bufferSize;
        this.context.strokeStyle = rgba([0, 255, 0], 0.5);
        for (var i = 0; i < this.profiler.buffer.length; i++) {
            //draw a vertical line at bottom of canvas
            frameRate = this.profiler.indexAt(i);
            this.context.beginPath();
            this.context.lineWidth = delta - 2;
            this.context.moveTo(xPosition, yPosition);
            this.context.lineTo(xPosition, yPosition - Math.min(frameRate, this.profiler.target) * frameRateDisplayScale);
            this.context.stroke();
            xPosition += delta;
        }
        // now draw slow frame delta in red
        xPosition = 0;
        frameRate = 0;
        this.context.strokeStyle = rgba([255, 0, 0], 0.5);
        for (var i = 0; i < this.profiler.buffer.length; i++) {
            //draw a vertical line at bottom of canvas
            frameRate = this.profiler.indexAt(i);
            if (frameRate > 0 && this.profiler.target - frameRate > 0) {
                this.context.beginPath();
                this.context.lineWidth = delta - 2;
                this.context.moveTo(xPosition, yPosition - frameRate * frameRateDisplayScale);
                this.context.lineTo(xPosition, yPosition - this.profiler.target * frameRateDisplayScale);
                this.context.stroke();
            }
            xPosition += delta;
        }
    },

    toggleConsole: function() {
        this.showConsole = !this.showConsole;
    }
};

function rgba (c, alpha = 1.0) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
}

function drawText (context, x, y, color, fontFamily, fontSize, str) {
    context.fillStyle = rgba(color);
    context.font = fontSize + 'px ' + fontFamily;
    context.fillText(str, x, y);
}

$(function () {
    var canvas = $('canvas')[0];
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = ctx.strokeStyle = 'black';
    this.gameController = new GameController(canvas);
});

document.onkeypress = function (event) {
    switch (event.key) {
        case 'c':
            this.gameController.toggleConsole();
        default:
            break;
    }
}
