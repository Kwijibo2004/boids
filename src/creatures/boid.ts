import { config } from "../config";
import { Vector2 } from "../vector2";
import { Behaviour } from "./behaviour";
import { Creature } from "./creature";
import { StaticTools } from "./staticTools";
import { Material } from "three";
import THREE = require("three");

export class Boid extends Creature {
    public mousePosition: Vector2 | null = null;
    public defaultColour = config.boid.defaultColour;
    public maxSpeed = config.boid.maxSpeed;
    public minSpeed = config.boid.minSpeed;
    public size = config.boid.size;
    public fearCountdown = 0;
    public priorities = [
        new Behaviour(() => this.mouseAvoidVector(), () => 0xff0000),
        new Behaviour(() => this.hunterEvasionVector(), () => 0xff0000),
        new Behaviour(() => this.repulsionVector(), () => this.fearCountdown ? 0xff0000 : 0xffaa00),
        new Behaviour(() => this.alignmentVector(), () => this.fearCountdown ? 0xff0000 : 0x0000ff),
        new Behaviour(() => this.attractionVector(), () => this.fearCountdown ? 0xff0000 : 0x00ff00),
    ];

    public initializeVelocity(): void {
        const heading = Math.random() * 2 * Math.PI;
        this.velocity = new Vector2(
            config.boid.maxSpeed * Math.cos(heading),
            config.boid.maxSpeed * Math.sin(heading),
        );
    }

    public update(): void {
        if (this.fearCountdown) {
            this.fearCountdown--;
        }
        this.move();
        this.renderedBody.position.x = this.position.x;
        this.renderedBody.position.y = this.position.y;
        this.renderedBody.rotation.z = -this.velocity.angleTo(new Vector2(0, 1));
        this.renderedBody.material = new THREE.MeshStandardMaterial({ color: this.colour })
    }

    public mouseAvoidVector(): Vector2 | null {
        if (this.mousePosition) {
            const vectorFromMouse = this.mousePosition.vectorTo(this.position);
            if (vectorFromMouse.length < config.boid.mouseAvoidRadius) {
                return vectorFromMouse.scaleToLength(this.maxSpeed);
            }
        }
        return null;
    }

    public hunterEvasionVector(): Vector2 | null {
        const huntersInSight = this.creatureStorage.getHuntersInArea(
            this.position,
            config.boid.visionRadius,
        ).filter((hunter) => {
            return Math.random() < hunter.chanceToSee(this.position, config.boid.visionRadius);
        });
        if (huntersInSight.length === 0) {
            return null;
        }

        this.fearCountdown = config.boid.fearDuration;

        const nearestHunter = StaticTools
            .nearestCreatureToPosition(huntersInSight, this.position);

        return nearestHunter.position
            .vectorTo(this.position)
            .scaleToLength(this.maxSpeed);
    }

    public repulsionVector(): Vector2 | null {
        const neighbours = this.creatureStorage.getBoidsInArea(
            this.position,
            config.boid.repulsionRadius,
        ).filter((boid) => boid.id !== this.id);
        if (neighbours.length === 0) {
            return null;
        }
        return Vector2.average(
            neighbours.map((creature) => {
                return creature.position.vectorTo(this.position);
            }),
        ).scaleToLength(this.fearCountdown ? this.maxSpeed : this.velocity.length * 0.9);
    }

    public alignmentVector(): Vector2 | null {
        const neighbours = this.creatureStorage.getBoidsInArea(
            this.position,
            config.boid.alignmentRadius,
        ).filter((boid) => boid.id !== this.id);
        if (neighbours.length === 0) {
            return null;
        }
        const averageAlignmentVector = Vector2.average(
            neighbours.map((creature) => {
                return creature.velocity;
            }),
        );
        if (this.fearCountdown) {
            return averageAlignmentVector.scaleToLength(this.maxSpeed);
        }
        return averageAlignmentVector;
    }

    public attractionVector(): Vector2 | null {
        const neighbours = this.creatureStorage.getBoidsInArea(
            this.position,
            config.boid.attractionRadius,
        ).filter((boid) => boid.id !== this.id);
        if (neighbours.length === 0) {
            return null;
        }

        const nearestNeighbour = StaticTools
            .nearestCreatureToPosition(neighbours, this.position);

        return this.position
            .vectorTo(nearestNeighbour.position)
            .scaleToLength(this.fearCountdown ? this.maxSpeed : nearestNeighbour.velocity.length * 1.1);
    }
}
