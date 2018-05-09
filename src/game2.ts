
// Non-confidential and non-proprietary information of Sam Donow
import { Coords, Direction, Dims } from "./GUITypes";

const enum View {
    Grid = 0,
    Color = 1,
    Both = 2,
    None = 3
}

function otherView(view : View) : View {
    return view === View.Grid ? View.Color : View.Grid;
}

/// Singleton class for storing various globals
class Globals {
    public width : number;
    public height : number;
    public readonly gridSize : number;
    public grid : Block[][];
    public playerSquares : Block[];
    public targetBlock : Block;
    private allowInput : boolean;
    constructor() {
        this.width =  document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.gridSize = 3;
        this.allowInput = false;
        this.targetBlock = null;
        this.grid = [];
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
    D = 'D'.charCodeAt(0)
}

function makeDiv(dim : Dims) : HTMLElement {
    const ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
    return ret;
}

enum BlockType {
    Empty = 0,
    Obstacle = 1,
    Player = 2,
    Target = 3
}

class Block {
    // Display value / location in the solution
    public loc : Coords;
    public state : BlockType;
    public node : HTMLElement;
    constructor(parentDims : Dims, parent : HTMLElement, loc : Coords) {
        const makeBlock = function() : HTMLElement {
                      return makeDiv({ width  :  (parentDims.width - G.gridSize * 5 * 6) / G.gridSize,
                                       height :  (parentDims.height - G.gridSize * 5 * 6) / G.gridSize });
                      };

        this.node = makeBlock();
        this.loc = Coords.copy(loc);
        parent.appendChild(this.node);
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.state = BlockType.Empty;
    }

    public updateDisplay() : void {

    }
}

function onKeyEvent(evt : KeyCode) : void  {
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
        default:
            return;
    }
    G.makeMove(dir);
    G.verifyIfSolved();
}
document.body.onkeydown = function(evt : KeyboardEvent) : void { onKeyEvent(evt.keyCode); };

function populateGameBoard(rootDims : Dims) : void {
    const rootNode : HTMLElement = makeDiv(rootDims);
    const childDims : Dims = { width : rootDims.height, height : rootDims.height };
    const locDiv : HTMLElement = makeDiv(childDims);
    for (let i : number = 0; i < G.gridSize; ++i) {
        const gridRow : Block[] = [];
        const colorRow : Block[] = [];
        G.grid.push(gridRow);
        G.grid.push(colorRow);
        for (let j : number = 0; j < G.gridSize; ++j) {
            const block = new Block(childDims, locDiv, new Coords(i, j));
            gridRow.push(block);
            colorRow.push(block);
        }
    }
    rootNode.appendChild(locDiv);
    document.body.appendChild(rootNode);
}

function generateNewPuzzle() : void {
    G.playerSquares.push(G.grid[0][0]);
}

function main() : void {
    const tbDim : Dims = { width: G.width, height: G.height / 15};
    const titleBar : HTMLElement = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Left: WASD, Right: Arrow Keys; move selection and rotate row/col</h1>";
    document.body.appendChild(titleBar);
    populateGameBoard({ width: G.width, height: G.height / 2 - tbDim.height});
    generateNewPuzzle();
}
document.body.onload = main;
