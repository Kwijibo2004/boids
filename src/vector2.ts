import { config } from "./config";

export class Vector2 {
    public static average(vectors: Vector2[]): Vector2 {
        if (vectors.length === 0) {
            return new Vector2();
        }
        const totalVector = vectors.reduce((partialSum, current) => {
            return partialSum.add(current);
        });

        return totalVector.scaleByScalar(1 / vectors.length);
    }

    public static fromHeadingAndSpeed(heading: number, speed: number): Vector2 {
        if (!speed) {
            return new Vector2(0, 0);
        }
        return new Vector2(
            speed * Math.cos(heading),
            speed * Math.sin(heading),
        );
    }

    public x: number;
    public y: number;
    public length: number;
    constructor(x: number = 0, y: number = 0) {
        this.x = x % config.screen.maxX;
        this.y = y % config.screen.maxY;
        this.length = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    public unitVector(): Vector2 {
        return this.scaleByScalar(1 / this.length);
    }

    public distance(v: Vector2): number {
        return this.vectorTo(v).length;
    }

    public vectorTo(vector: Vector2): Vector2 {
        let nearestX = (vector.x - this.x) % config.screen.maxX;
        if (nearestX > (config.screen.maxX / 2)) {
            nearestX -= config.screen.maxX;
        }
        if (nearestX < -(config.screen.maxX / 2)) {
            nearestX += config.screen.maxX;
        }
        let nearestY = (vector.y - this.y) % config.screen.maxY;
        if (nearestY > (config.screen.maxY / 2)) {
            nearestY -= config.screen.maxY;
        }
        if (nearestY < -(config.screen.maxY / 2)) {
            nearestY += config.screen.maxY;
        }
        return new Vector2(nearestX, nearestY);
    }

    public rotate(radians: number): Vector2 {
        return new Vector2(
            this.x * Math.cos(radians) - this.y * Math.sin(radians),
            this.x * Math.sin(radians) + this.y * Math.cos(radians),
        );
    }

    // Measures anti clockwise from -PI to PI
    public angleTo(v: Vector2): number {
        return Math.atan2(
            this.x * v.y - this.y * v.x,
            this.x * v.x + this.y * v.y,
        );
    }

    public add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    public subtract(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    public equals(v: Vector2): boolean {
        return this.x === v.x && this.y === v.y;
    }

    public scaleByScalar(scale: number): Vector2 {
        return new Vector2(this.x * scale, this.y * scale);
    }

    public scaleToLength(length: number): Vector2 {
        return this.length ?
            this.scaleByScalar(length / this.length) :
            this;
    }

    public isParallelTo(v: Vector2): boolean {
        return this.x * v.y === this.y * v.x;
    }

    public normalize(): Vector2 {
        if (0 <= this.x &&
            0 <= this.y) {
            return this;
        }
        return new Vector2(
            ((this.x % config.screen.maxX) + config.screen.maxX) % config.screen.maxX,
            ((this.y % config.screen.maxY) + config.screen.maxY) % config.screen.maxY,
        );
    }

    public toHeading() {
        return Math.atan2(this.y, this.x);
    }

    public toString() {
        return `[${this.x}, ${this.y}]`;
    }
}
