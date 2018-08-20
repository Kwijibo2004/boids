import { Vector2 } from "./vector2";

export class MouseHandler {
    public mousePosition: Vector2 | null;
    private mouseArea: HTMLElement;
    private createBoid: (position: Vector2) => void;
    private createHunter: (position: Vector2) => void;

    constructor(
        mouseArea: HTMLElement,
        createBoid: (position: Vector2) => void,
        createHunter: (position: Vector2) => void,
    ) {
        this.mousePosition = new Vector2(-1, -1);
        this.mouseArea = mouseArea;
        this.createBoid = createBoid;
        this.createHunter = createHunter;
        this.mouseArea.onmousemove = (event: MouseEvent) => {
            this.handleMouseMove(event);
        };
        this.mouseArea.onmouseout = () => { this.handleMouseOut(); };
        this.mouseArea.onclick = (event: MouseEvent) => {
            this.handleMouseClick(event);
        };
    }

    public handleMouseMove(event: MouseEvent) {
        const rect = this.mouseArea.getBoundingClientRect();
        this.mousePosition = new Vector2(
            event.clientX - rect.left,
            event.clientY - rect.top,
        );
    }

    public handleMouseClick(event: MouseEvent) {
        if (this.mousePosition) {
            if (event.ctrlKey) {
                this.createHunter(this.mousePosition);
            } else {
                this.createBoid(this.mousePosition);
            }
        }
    }

    public handleMouseOut() {
        this.mousePosition = null;
    }
}
