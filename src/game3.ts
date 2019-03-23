
// Non-confidential and non-proprietary information of Sam Donow
import { Coords, Direction, Dims, Color } from "./GUITypes";
// import { MersenneTwister } from "../3ps/MersenneTwister";

type PuzzleDescription = string[];

/// Singleton class for storing various globals
class Globals {
    public width : number;
    public height : number;
    public readonly gridSize : number;
    public grid : Block[][];
    public playerSquares : Coords[];
    private allowInput : boolean;
    private currentPuzzleIdx : number;
    private levels : PuzzleDescription[];
    private cursor? : Block;
    public labels? : Labels;
    constructor() {
        this.width = document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.gridSize = 10;
        this.allowInput = true;
        this.grid = [];
        this.playerSquares = [];
        this.currentPuzzleIdx = 0;
        this.levels = [];
        this.cursor = undefined;
    }

    public setCursor(blk : Block) : void {
        if (this.cursor !== undefined) {
            this.cursor.setSelected(false);
        }
        this.cursor = blk;
        this.cursor.setSelected(true);
    }

    public getCursor() : Block {
        if (this.cursor === undefined) {
            throw new Error("no cursor");
        } else {
            return this.cursor;
        }
    }
    public makeMove(dir : Direction) : void {
        G.allowInput = false;
        const blck = this.getBlockInDirection(this.getCursor().loc, dir);
        if (blck !== null) {
            this.setCursor(blck);
        }
        G.allowInput = true;
    }

    private checkWin() : void {
        const puzzle = this.levels[this.currentPuzzleIdx];
        for (let i : number = 0; i < this.grid.length; i += 1) {
            for (let j : number = 0; j < this.grid.length; j += 1) {
                const state = this.grid[i][j].state;
                const c = puzzle[i].charAt(j);
                if (c === "1" && state !== BlockType.Filled) {
                    return;
                }
            }
        }
        this.youWin();
    }

    public isInputAllowed() : boolean {
        return this.allowInput;
    }

    public setState(loc : Coords, state : BlockType) : void {
        const block : Block = this.grid[loc.row][loc.col];
        block.state = state;
        block.updateDisplay();
    }

    public toggleCurrent(active : boolean) {
        const type = (function(ty : BlockType) {
            switch (ty) {
                case BlockType.Empty:
                    return active ? BlockType.Filled : BlockType.Flagged;
                case BlockType.Filled:
                case BlockType.Flagged:
                    return BlockType.Empty;
            }
        })(this.getCursor().state);
        this.getCursor().state = type;
        this.getCursor().updateDisplay();
        this.checkWin();
    }

    public resetPuzzle(puzzle? : PuzzleDescription) : void {
        if (puzzle !== undefined) {
            this.levels.push(puzzle);
            this.currentPuzzleIdx = this.levels.length + 1;
        }
        puzzle = this.currentPuzzle();
        this.playerSquares = [];
        this.allowInput = true;
        if (puzzle.length !== G.gridSize || puzzle[0].length !== G.gridSize) {
            throw new Error("Bad puzzle size");
        }
        for (let i = 0; i < G.gridSize; ++i) {
            for (let j = 0; j < G.gridSize; ++j) {
                G.setState(new Coords(i, j), BlockType.Empty);
            }
        }
        if (G.labels) {
            G.labels.setLabels(puzzle);
        }
    }

    // private rnd = new MersenneTwister(1);
    public randomPuzzle(dims : Dims) : PuzzleDescription {
        const rows : PuzzleDescription = [];
        for (let i = 0; i < dims.height; ++i) {
            let row : string = "";
            for (let j = 0; j < dims.width; ++j) {
                row += (Math.random() > 0.5) ? "0" : "1";
            }
            rows.push(row);
        }
        return rows;
    }

    public loadPuzzles() : void {
        /*
        const level1 : string[] = [
            "0001100000",
            "0001100000",
            "0000000000",
            "0000000000",
            "0000000000",
            "0000000000",
            "0000000000",
            "0000000000",
            "0001100010",
            "0001100000"
        ];
        */

        this.levels = [this.randomPuzzle({ width: 10, height: 10})];
    }

    private currentPuzzle() : PuzzleDescription {
        return this.levels[this.currentPuzzleIdx];
    }

    private youWin() : void {
        setTimeout(() => {
            alert("You won, yay");
            this.currentPuzzleIdx++;
            this.currentPuzzleIdx %= this.levels.length;
            this.resetPuzzle();
        }, 0);
    }

    private getBlockInDirection(loc : Coords, dir : Direction) : Block | null {
        const place : Coords = Coords.copy(loc);
        switch (dir) {
            case Direction.Up:
                place.row -= 1;
                break;
            case Direction.Down:
                place.row += 1;
                break;
            case Direction.Left:
                place.col -= 1;
                break;
            case Direction.Right:
                place.col += 1;
                break;
            default:
                throw new Error("Invalid direction " + dir);
        }
        if (place.col < 0 || place.col >= this.gridSize ||
            place.row < 0 || place.row >= this.gridSize) {
            return null;
        }
        return this.grid[place.row][place.col];
    }
}

const G = new Globals();

enum KeyCode {
    Enter = 13,
    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40,
    W = 'W'.charCodeAt(0),
    A = 'A'.charCodeAt(0),
    S = 'S'.charCodeAt(0),
    D = 'D'.charCodeAt(0),
    R = 'R'.charCodeAt(0),
    Z = 'Z'.charCodeAt(0),
    X = 'X'.charCodeAt(0)
}

function makeDiv(dim : Dims) : HTMLElement {
    const ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
    return ret;
}

function makeBlock(parentDims : Dims) : HTMLElement {
    const ret = makeDiv({
        width: (parentDims.width) / (G.gridSize + 1) - 11,
        height: (parentDims.height) / (G.gridSize + 1) - 11
    });
    ret.style.borderWidth = "5px 5px 5px 5px";
    ret.style.border = "5px solid #FFFFFF";
    return ret;
}

enum BlockType {
    Empty,
    Filled,
    Flagged
}

class Label {
    public node : HTMLElement;

    constructor(parentDims : Dims, parent : HTMLElement) {
        this.node = makeBlock(parentDims);
        this.node.style.textAlign = "center";
        parent.appendChild(this.node);
    }

    public setLabel(lbl : number[], vertical : boolean) : void {
        const joinChar = vertical ? "</br>" : " ";
        this.node.innerHTML = lbl.join(joinChar);
        if (lbl.length === 0) {
            this.node.textContent = "_";
        }
    }
}

class Labels {
    private rows : Label[] = [];
    private cols : Label[] = [];

    constructor() {

    }
    public addLabel(parentDims : Dims, parent : HTMLElement, isRow : boolean) {
        const newLabel = new Label(parentDims, parent);
        const arr = isRow ? this.rows : this.cols;
        arr.push(newLabel);
    }

    public setLabels(puzzle : PuzzleDescription) : void {
        if (this.rows.length !== puzzle.length || this.cols.length !== puzzle[0].length) {
            throw new Error("Bad puzzle dimensions");
        }
        const colStrs : string[] = [];
        for (const _ of this.cols) {
            colStrs.push("");
        }
        for (let i : number = 0; i < this.rows.length; i += 1) {
            const row = puzzle[i];
            this.rows[i].setLabel(Labels.getLabel(row), false);
            for (let j : number = 0; j < this.cols.length; j += 1) {
                colStrs[j] += row[j];
            }
        }
        for (let i : number = 0; i < this.cols.length; i += 1) {
            this.cols[i].setLabel(Labels.getLabel(colStrs[i]), true);
        }
    }

    public static getLabel(data : string) : number[] {
        const ret : number[] = [];
        let current = 0;
        for (let i : number = 0; i < data.length; i += 1) {
            if (data.charAt(i) === '0') {
                if (current > 0) {
                    ret.push(current);
                }
                current = 0;
            } else {
                current += 1;
            }
        }
        if (current > 0) {
            ret.push(current);
        }
        return ret;
    }

}

class Block {
    // Display value / location in the solution
    public loc : Coords;
    public state : BlockType;
    public node : HTMLElement;
    constructor(parentDims : Dims, parent : HTMLElement, loc : Coords) {
        this.node = makeBlock(parentDims);
        this.loc = Coords.copy(loc);
        parent.appendChild(this.node);
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.node.style.border = "5px solid #0c0c0c";
        this.state = BlockType.Empty;
        this.updateDisplay();
    }

    public updateDisplay() : void {
        let col : Color;
        switch (this.state) {
            case BlockType.Empty:
                col = Color.white();
                break;
            case BlockType.Filled:
                col = Color.blue();
                break;
            case BlockType.Flagged:
                col = Color.red();
                break;
            default:
                throw new Error("Bad blocktype " + this.state);
        }
        this.node.style.backgroundColor = col.toCSSString();
    }

    public setSelected(isSelected : boolean) : void {
        if (!isSelected) {
            this.node.style.border = "5px solid #0c0c0c";
        } else {
            this.node.style.border = "5px solid #cc0001";
        }
    }
}

function onKeyEvent(evt : KeyCode) : void {
    if (!G.isInputAllowed()) {
        return;
    }
    let dir : Direction;
    switch (evt) {
        case KeyCode.UpArrow:
        case KeyCode.W:
            dir = Direction.Up;
            break;
        case KeyCode.LeftArrow:
        case KeyCode.A:
            dir = Direction.Left;
            break;
        case KeyCode.RightArrow:
        case KeyCode.D:
            dir = Direction.Right;
            break;
        case KeyCode.DownArrow:
        case KeyCode.S:
            dir = Direction.Down;
            break;
        case KeyCode.R:
            G.resetPuzzle();
            return;
        case KeyCode.Enter:
        case KeyCode.Z:
            G.toggleCurrent(true);
            return;
        case KeyCode.X:
            G.toggleCurrent(false);
            return;
        default:
            return;
    }
    G.makeMove(dir);
}
document.body.onkeydown = function(evt : KeyboardEvent) : void { onKeyEvent(evt.keyCode); };

function populateGameBoard(rootDims : Dims) : void {
    G.labels = new Labels();
    const rootNode : HTMLElement = makeDiv(rootDims);
    const childDims : Dims = { width: rootDims.height, height: rootDims.height };
    const locDiv : HTMLElement = makeDiv(childDims);
    const topLabelDiv = makeDiv({ width: rootDims.width, height: childDims.height / 5 });
    const topLeftCorner = makeBlock(childDims);
    topLeftCorner.textContent = "*";
    topLabelDiv.appendChild(topLeftCorner);
    for (let i : number = 0; i < G.gridSize; ++i) {
        G.labels.addLabel(childDims, topLabelDiv, false);
    }
    for (let i : number = 0; i < G.gridSize; ++i) {
        const gridRow : Block[] = [];
        G.grid.push(gridRow);
        G.labels.addLabel(childDims, locDiv, true);
        for (let j : number = 0; j < G.gridSize; ++j) {
            const block = new Block(childDims, locDiv, new Coords(i, j));
            gridRow.push(block);
        }
    }
    G.setCursor(G.grid[0][0]);
    rootNode.appendChild(topLabelDiv);
    rootNode.appendChild(locDiv);
    document.body.appendChild(rootNode);
}

let once : boolean = false;
function main() : void {
    if (once) {
        return;
    } else {
        once = true;
    }
    const tbDim : Dims = { width: G.width, height: G.height / 7 };
    const titleBar : HTMLElement = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Picross. </br> </h1>";
    document.body.appendChild(titleBar);
    populateGameBoard({ width: G.width, height: G.height / 1.5 - tbDim.height });
    G.loadPuzzles();
    G.resetPuzzle();
}
document.body.onload = main;
