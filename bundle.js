(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simulationManager_1 = require("./simulationManager");
document.addEventListener("DOMContentLoaded", () => {
    new simulationManager_1.SimulationManager().runSimulation();
}, false);

},{"./simulationManager":6}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const vector2_1 = require("./vector2");
class Boid {
    constructor() {
        this.history = [];
        this.otherBoids = [];
        this.mousePosition = new vector2_1.Vector2(-1, -1);
        this.position = new vector2_1.Vector2(0, 0);
        for (let i = 0; i < config_1.config.maxHistory; i++) {
            this.history.push(new vector2_1.Vector2(0, 0));
        }
        const heading = Math.random() * 2 * Math.PI;
        const speedRange = config_1.config.maxSpeed - config_1.config.minSpeed;
        const speed = config_1.config.minSpeed + (Math.random() * speedRange);
        this.velocity = new vector2_1.Vector2(speed * Math.cos(heading), speed * Math.sin(heading));
    }
    nearestNeighbour() {
        if (this.otherBoids.length === 0) {
            throw new Error("No other boids");
        }
        return this.otherBoids.reduce((nearestBoid, currentBoid) => {
            const nearestDistance = this.distanceToBoid(nearestBoid);
            const currentDistance = this.distanceToBoid(currentBoid);
            return currentDistance < nearestDistance ? currentBoid : nearestBoid;
        });
    }
    distanceToBoid(boid) {
        return this.position.distance(boid.position);
    }
    move() {
        this.history.push(this.position);
        while (this.history.length > config_1.config.maxHistory) {
            this.history = this.history.slice(1);
        }
        this.position = this.position.add(this.velocity);
        this.position = this.position.clip(config_1.config.minX, config_1.config.maxX, config_1.config.minY, config_1.config.maxY);
        this.updateHeading();
    }
    updateHeading() {
        const mouseAvoidVector = this.mouseAvoidVector();
        if (mouseAvoidVector.length() > 0) {
            return this.updateHeadingTowards(mouseAvoidVector);
        }
        const collisionVector = this.collisionVector();
        if (collisionVector.length() > 0) {
            return this.updateHeadingTowards(collisionVector);
        }
        const repulsionVector = this.repulsionVector();
        if (repulsionVector.length() > 0) {
            return this.updateHeadingTowards(repulsionVector);
        }
        const alignmentVector = this.alignmentVector();
        if (alignmentVector.length() > 0) {
            return this.updateHeadingTowards(alignmentVector);
        }
        const attractionVector = this.attractionVector();
        if (attractionVector.length() > 0) {
            return this.updateHeadingTowards(attractionVector);
        }
        const randomTurn = 2 * config_1.config.turningMax * Math.random() - config_1.config.turningMax;
        this.velocity = this.velocity.rotate(randomTurn);
    }
    updateHeadingTowards(vector) {
        const idealTurn = this.velocity.angleTo(vector);
        const limitedTurn = Math.max(Math.min(idealTurn, config_1.config.turningMax), -config_1.config.turningMax);
        this.velocity = this.velocity.rotate(limitedTurn);
        return;
    }
    mouseAvoidVector() {
        if (this.mousePosition.x > -1) {
            const vectorFromMouse = this.mousePosition.vectorTo(this.position);
            if (vectorFromMouse.length() < config_1.config.mouseRadius) {
                return vectorFromMouse;
            }
        }
        return new vector2_1.Vector2(0, 0);
    }
    collisionVector() {
        const xMin = this.position.x - config_1.config.minX;
        const xMax = config_1.config.maxX - this.position.x;
        const yMin = this.position.y - config_1.config.minY;
        const yMax = config_1.config.maxY - this.position.y;
        let result = new vector2_1.Vector2(0, 0);
        if (xMin < config_1.config.collisionRadius) {
            result = result.add(new vector2_1.Vector2(1, 0));
        }
        if (xMax < config_1.config.collisionRadius) {
            result = result.add(new vector2_1.Vector2(-1, 0));
        }
        if (yMin < config_1.config.collisionRadius) {
            result = result.add(new vector2_1.Vector2(0, 1));
        }
        if (yMax < config_1.config.collisionRadius) {
            result = result.add(new vector2_1.Vector2(0, -1));
        }
        return result;
    }
    repulsionVector() {
        return vector2_1.Vector2.average(this.neighbours(config_1.config.repulsionRadius).map((boid) => {
            return this.position.vectorTo(boid.position);
        })).unitVector().scaleByScalar(-1);
    }
    attractionVector() {
        if (this.otherBoids.length === 0) {
            return new vector2_1.Vector2(0, 0);
        }
        return vector2_1.Vector2.average(this.neighbours(config_1.config.attractionRadius).map((boid) => {
            return this.position.vectorTo(boid.position);
        })).unitVector();
    }
    alignmentVector() {
        return vector2_1.Vector2.average(this.neighbours(config_1.config.alignmentRadius).map((boid) => {
            return boid.velocity;
        })).unitVector();
    }
    neighbours(radius) {
        if (this.otherBoids.length === 0) {
            return [];
        }
        return this.otherBoids.filter((boid) => {
            return this.distanceToBoid(boid) < radius;
        });
    }
}
exports.Boid = Boid;

},{"./config":4,"./vector2":7}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
class Canvas {
    // Where speed is 0 to 1, min to max
    static colorFromSpeed(speed) {
        return "hsl(" + (speed * 360) + ", 50%, 50%)";
    }
    constructor(canvasElement) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext("2d");
        if (!context) {
            throw new Error("could not get canvas context");
        }
        else {
            this.ctx = context;
        }
        this.canvas.height = config_1.config.maxY;
        this.canvas.width = config_1.config.maxX;
        this.speedRange = config_1.config.maxSpeed - config_1.config.minSpeed;
    }
    draw(boids) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (window) {
            config_1.config.maxX = window.innerWidth * 0.9;
            config_1.config.maxY = window.innerHeight * 0.9;
        }
        this.ctx.canvas.width = config_1.config.maxX;
        this.ctx.canvas.height = config_1.config.maxY;
        this.drawGhosts(boids);
        boids.forEach((boid) => {
            this.drawBoid(boid);
        });
    }
    drawGhosts(boids) {
        if (!config_1.config.maxHistory) {
            return;
        }
        for (let i = 0; i < config_1.config.maxHistory; i++) {
            this.ctx.globalAlpha = (i + 1) / config_1.config.maxHistory;
            boids.forEach((boid) => {
                this.drawGhost(boid, i);
            });
        }
    }
    drawGhost(boid, historyIndex) {
        this.drawBoidBody(boid, historyIndex);
    }
    drawBoid(boid) {
        this.drawBoidBody(boid);
        this.drawBoidBeak(boid);
    }
    drawBoidBody(boid, historyIndex) {
        const position = historyIndex ? boid.history[historyIndex] : boid.position;
        const radius = historyIndex ?
            4 * (historyIndex / config_1.config.maxHistory) :
            4;
        this.ctx.beginPath();
        const speedProportion = (boid.velocity.length() - config_1.config.minSpeed) / this.speedRange;
        const colour = Canvas.colorFromSpeed(speedProportion);
        this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = colour;
        this.ctx.fill();
    }
    drawBoidBeak(boid) {
        const speedProportion = 0.25 + (boid.velocity.length() - config_1.config.minSpeed) / (2 * this.speedRange);
        this.ctx.beginPath();
        this.ctx.arc(boid.position.x + speedProportion * boid.velocity.x, boid.position.y + speedProportion * boid.velocity.y, 2, 0, 2 * Math.PI);
        this.ctx.fillStyle = "black";
        this.ctx.fill();
    }
}
exports.Canvas = Canvas;

},{"./config":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    alignmentRadius: 40,
    attractionRadius: 100,
    boidQuantity: 100,
    collisionRadius: 25,
    maxHistory: 5,
    maxSpeed: 4,
    maxX: 1000,
    maxY: 1000,
    minSpeed: 3,
    minX: 0,
    minY: 0,
    mouseRadius: 50,
    repulsionRadius: 20,
    turningMax: 0.2,
};

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vector2_1 = require("./vector2");
class MouseHandler {
    constructor(mouseArea) {
        this.mousePosition = new vector2_1.Vector2(-1, -1);
        this.mouseArea = mouseArea;
        this.mouseArea.onmousemove = (event) => {
            this.handleMouseMove(event);
        };
        this.mouseArea.onmouseout = () => { this.handleMouseOut(); };
    }
    handleMouseMove(event) {
        const rect = this.mouseArea.getBoundingClientRect();
        this.mousePosition = new vector2_1.Vector2(event.clientX - rect.left, event.clientY - rect.top);
    }
    handleMouseOut() {
        this.mousePosition = new vector2_1.Vector2(-1, -1);
    }
}
exports.MouseHandler = MouseHandler;

},{"./vector2":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boid_1 = require("./boid");
const canvas_1 = require("./canvas");
const config_1 = require("./config");
const mouseHandler_1 = require("./mouseHandler");
class SimulationManager {
    constructor() {
        this.boids = [];
        const canvasElement = document.getElementById("canvas");
        if (!canvasElement) {
            throw new Error("couldn't find 'canvas' on document");
        }
        this.canvas = new canvas_1.Canvas(canvasElement);
        for (let i = 0; i < config_1.config.boidQuantity; i++) {
            this.boids.push(new boid_1.Boid());
        }
        this.boids.forEach((boid) => {
            boid.otherBoids = this.boids.filter((otherboid) => otherboid !== boid);
        });
        this.mouseHandler = new mouseHandler_1.MouseHandler(canvasElement);
    }
    runSimulation() {
        this.tick();
    }
    tick() {
        this.boids.forEach((boid) => {
            boid.mousePosition = this.mouseHandler.mousePosition;
            boid.move();
        });
        this.canvas.draw(this.boids);
        ((thisCaptured) => {
            setTimeout(() => {
                thisCaptured.tick();
            }, 1000 / 60);
        })(this);
    }
}
exports.SimulationManager = SimulationManager;

},{"./boid":2,"./canvas":3,"./config":4,"./mouseHandler":5}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Vector2 {
    static average(vectors) {
        if (vectors.length === 0) {
            return new Vector2(0, 0);
        }
        const totalVector = vectors.reduce((partialSum, current) => {
            return partialSum.add(current);
        });
        const averageVector = totalVector.scaleByScalar(1 / vectors.length);
        return averageVector;
    }
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    unitVector() {
        const length = this.length();
        return this.scaleByScalar(1 / length);
    }
    distance(v) {
        return Math.sqrt(Math.pow(v.x - this.x, 2) + Math.pow(v.y - this.y, 2));
    }
    vectorTo(vector) {
        return new Vector2(vector.x - this.x, vector.y - this.y);
    }
    rotate(radians) {
        return new Vector2(this.x * Math.cos(radians) - this.y * Math.sin(radians), this.x * Math.sin(radians) + this.y * Math.cos(radians));
    }
    // Measures anti clockwise from -PI to PI
    angleTo(v) {
        return Math.atan2(this.x * v.y - this.y * v.x, this.x * v.x + this.y * v.y);
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    clip(xMin, xMax, yMin, yMax) {
        return new Vector2(Math.min(Math.max(this.x, xMin), xMax), Math.min(Math.max(this.y, yMin), yMax));
    }
    equals(v) {
        return this.x === v.x && this.y === v.y;
    }
    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    scaleByScalar(scale) {
        return new Vector2(this.x * scale, this.y * scale);
    }
    scaleToLength(length) {
        return this.scaleByScalar(length / this.length());
    }
}
exports.Vector2 = Vector2;

},{}]},{},[1]);
