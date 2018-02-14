(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boidManager_1 = require("./boidManager");
document.addEventListener("DOMContentLoaded", () => {
    new boidManager_1.BoidManager(50).runSimulation();
}, false);

},{"./boidManager":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const vector2_1 = require("./vector2");
class Boid {
    constructor() {
        this.body = null;
        this.beak = null;
        this.otherBoids = [];
        this.position = new vector2_1.Vector2(Math.random() * 80 + 10, Math.random() * 80 + 10);
        const heading = Math.random() * 2 * Math.PI;
        this.velocity = new vector2_1.Vector2(config_1.config.speed * Math.cos(heading), config_1.config.speed * Math.sin(heading));
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
        this.position = this.position.add(this.velocity);
        this.position = this.position.clip(10, 90, 10, 90);
        this.updateHeading();
    }
    updateHeading() {
        if (this.otherBoids.length > 0) {
            const nearestNeighbour = this.nearestNeighbour();
            if (this.distanceToBoid(nearestNeighbour) < config_1.config.repulsionRadius) {
                const relativeVectorTo = this.position.vectorTo(nearestNeighbour.position);
                this.velocity = this.velocity.rotateAwayFrom(relativeVectorTo, config_1.config.turningMax);
                return;
            }
        }
        const randomTurn = 2 * config_1.config.turningMax * Math.random() - config_1.config.turningMax;
        this.velocity = this.velocity.rotate(randomTurn);
    }
    repulsionVector() {
        // TODO implement properly
        return new vector2_1.Vector2(-1, -1);
    }
    neighbours(radius) {
        return this.otherBoids.filter((boid) => {
            return this.distanceToBoid(boid) < radius;
        });
    }
}
exports.Boid = Boid;

},{"./config":5,"./vector2":6}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boid_1 = require("./boid");
const canvas_1 = require("./canvas");
class BoidManager {
    constructor(boidQuantity) {
        this.boids = [];
        const canvasElement = document.getElementById("canvas");
        if (!canvasElement) {
            throw new Error("couldn't find 'canvas' on document");
        }
        this.canvas = new canvas_1.Canvas(canvasElement);
        for (let i = 0; i < boidQuantity; i++) {
            this.boids.push(new boid_1.Boid());
        }
        this.boids.forEach((boid) => {
            boid.otherBoids = this.boids.filter((otherboid) => otherboid !== boid);
        });
    }
    runSimulation() {
        this.tick();
    }
    tick() {
        this.boids.forEach((boid) => {
            boid.move();
        });
        this.canvas.update(this.boids);
        ((thisCaptured) => {
            setTimeout(() => {
                thisCaptured.tick();
            }, 1000 / 12);
        })(this);
    }
}
exports.BoidManager = BoidManager;

},{"./boid":2,"./canvas":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Canvas {
    static randomColor() {
        const hue = Math.random() * 360;
        return "hsl(" + hue + ", 50%, 50%)";
    }
    constructor(canvasElement) {
        this.canvas = canvasElement;
    }
    addElement(element) {
        this.canvas.insertAdjacentElement("beforeend", element);
    }
    update(boids) {
        boids.forEach((boid) => {
            this.updateBoid(boid);
        });
    }
    updateBoid(boid) {
        if (!boid.body) {
            boid.body = this.buildBodyPart(Canvas.randomColor(), "boid");
            this.canvas.insertAdjacentElement("beforeend", boid.body);
        }
        if (!boid.beak) {
            boid.beak = this.buildBodyPart("black", "beak");
            boid.body.insertAdjacentElement("beforeend", boid.beak);
        }
        boid.body.style.left = boid.position.x + "vw";
        boid.body.style.top = boid.position.y + "vh";
        boid.beak.style.left = 4 * boid.velocity.x + 2 + "px";
        boid.beak.style.top = 4 * boid.velocity.y + 2 + "px";
    }
    buildBodyPart(color, className) {
        const bodyPart = document.createElement("div");
        bodyPart.className = className;
        bodyPart.style.backgroundColor = color;
        return bodyPart;
    }
}
exports.Canvas = Canvas;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    repulsionRadius: 5,
    speed: 1,
    turningMax: 0.5,
};

},{}],6:[function(require,module,exports){
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
    distance(v) {
        return Math.sqrt(Math.pow(v.x - this.x, 2) + Math.pow(v.y - this.y, 2));
    }
    vectorTo(vector) {
        return new Vector2(vector.x - this.x, vector.y - this.y);
    }
    rotate(radians) {
        return new Vector2(this.x * Math.cos(radians) - this.y * Math.sin(radians), this.x * Math.sin(radians) + this.y * Math.cos(radians));
    }
    rotateAwayFrom(vector, angle) {
        const relativeAngleFromVectorToThis = Math.atan2(vector.x * this.y - vector.y * this.x, vector.x * this.x + vector.y * this.y);
        if (relativeAngleFromVectorToThis > 0) {
            return this.rotate(Math.min(Math.PI - relativeAngleFromVectorToThis, angle));
        }
        else {
            return this.rotate(Math.max(-relativeAngleFromVectorToThis - Math.PI, -angle));
        }
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
}
exports.Vector2 = Vector2;

},{}]},{},[1]);
