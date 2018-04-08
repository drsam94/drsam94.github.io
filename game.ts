document.body.onload = main;

class Color {
    r : number;
    g : number;
    b : number;
    constructor(red : number, green : number, blue : number) {
        this.r = red;
        this.g = green;
        this.b = blue;
    }

    toCSSString() : string {
        return "rgba(" + this.r.toString() + ", " +
                         this.g.toString() + ", " +
                         this.b.toString() + ", 1.0)";
    }

    mul(x : number) : Color {
        return new Color(Math.round(this.r * x),
                         Math.round(this.g * x),
                         Math.round(this.b * x));
    }
};

class Coords {
    row : number;
    col : number;
    constructor(row_ : number, col_ : number) {
        this.row = row_;
        this.col = col_;
    }

    // Meant to be used as a copy contructor
    static copy(other : Coords) : Coords {
        return new Coords(other.row, other.col);
    }

    deltaTo(target : Coords) : Coords {
        return new Coords(target.row - this.row, target.col - this.col);
    }

    applyDelta(target : Coords) : Coords {
        return new Coords(((target.row + this.row) + G.gridSize) % G.gridSize,
                          ((target.col + this.col) + G.gridSize) % G.gridSize);
    }

    toHTMLString() : string {
        return "<p>(" + this.row.toString() + ", " + this.col.toString() + ")</p>";
    }

    // row -> color
    // col -> scale
    toColor() : Color {
        return G.colors[this.row].mul((this.col + 1) / G.gridSize);
    }

    wrap(size : number) : void {
        if (this.row < 0) { this.row = size - 1; }
        else if (this.row == size) { this.row = 0; }
        if (this.col < 0) { this.col = size - 1; }
        else if (this.col == size) { this.col = 0; }
    }
};

/// Singleton class for storing various globals
class Globals {
    width : number;
    height : number;
    selection : Coords;
    gridSize : number;
    locGrid : Block[][];
    colorGrid : Block[][];
    colors : Color[];
    constructor() {
        this.width =  document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.selection = new Coords(0, 0);
        this.gridSize = 3;
        this.locGrid = [];
        this.colorGrid = [];
        this.colors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
    }

    selectedCol() : Block[] {
        var ret : Block[] = [];
        for (let i = 0; i < this.gridSize; ++i) {
            ret.push(this.locGrid[i][this.selection.col]);
        }
        return ret;
    }
};

const G = new Globals();

enum KeyCode {
    Enter = 13,
    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40
};

interface Dims {
    width : number;
    height : number;
};

function makeDiv(dim : Dims) : HTMLElement {
    const ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
    return ret;
}

function getStyleDimensions(node : HTMLElement) : Dims {
    const widthS  : string = node.style.width.toString();
    const heightS : string = node.style.height.toString();
    return {
        width  : Number(widthS.substring(0, widthS.length - 2)),
        height : Number(heightS.substring(0, widthS.length - 2))
    };
}

class Block {
    // Display value / location in the solution
    colorLoc : Coords;
    // Location on grid
    gridLoc : Coords;
    node : HTMLElement;
    setDefault() : void {
        this.node.style.border = "1px solid #ccc";
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.updateDisplay();
    }

    setSelected() : void {
        this.node.style.border = "1px solid #ff00ff";
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.updateDisplay();
    }

    updateDisplay() : void {
        this.node.innerHTML = this.colorLoc.toHTMLString();
        this.node.style.backgroundColor = this.colorLoc.toColor().toCSSString();
    }

    swapWith(targetLoc : Coords) : void {
        // TODO: make sense with new game
        const targetBlock = G.locGrid[targetLoc.row][targetLoc.col];
        const tmp : Coords = this.colorLoc;
        this.colorLoc = targetBlock.colorLoc;
        targetBlock.colorLoc = tmp;
        this.updateDisplay();
        targetBlock.updateDisplay();
    }

    constructor(rootNode : HTMLElement, width : number, height : number, _loc : Coords) {
        const parentDims : Dims = getStyleDimensions(rootNode);
        const block = makeDiv({ width  :  (parentDims.width - width*5*6) / width,
                                height :  (parentDims.height - height*5*6) / height });

        this.node = block;
        this.node.onclick = () => { changeSelectionTo(new Coords(this.colorLoc.row, this.gridLoc.col)); };
        this.gridLoc = Coords.copy(_loc);
        this.colorLoc = Coords.copy(_loc);
        this.setDefault();
    }
};


function changeSelectionTo(newSelection : Coords) : void {
    // TODO: also apply to the color-selected row
    for (let block of G.selectedCol()) {
        block.setDefault();
    }
    G.selection = newSelection;
    for (let block of G.selectedCol()) {
        block.setSelected();
    }
}

document.body.onkeydown = function(evt : KeyboardEvent) : void  {
    const pos : Coords = Coords.copy(G.selection);
    switch (evt.keyCode) {
        case KeyCode.UpArrow:
            pos.row -= 1;
            break;
        case KeyCode.LeftArrow:
            pos.col -= 1;
            break;
        case KeyCode.RightArrow:
            pos.col += 1;
            break;
        case KeyCode.DownArrow:
            pos.row += 1;
            break;
        case KeyCode.Enter:
            // TODO: implement swapping logic here
        default:
            return;
    }
    pos.wrap(G.gridSize);
    changeSelectionTo(pos);
}

function populateGameBoard(rootNode : HTMLElement, width : number, height : number) : void {
    for (let i : number = 0; i < height; ++i) {
        const row : Block[] = [];
        G.locGrid.push(row);
        for (let j : number = 0; j < width; ++j) {
            const block = new Block(rootNode, width, height, new Coords(i, j));
            row.push(block);
            rootNode.appendChild(block.node);
        }
    }
    // TODO: also draw the inverted (color) board
}

function main() : void {
    const tbDim : Dims = { width: G.width, height: G.height / 20};
    const titleBar = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Foo</h1>";
    document.body.appendChild(titleBar);
    const potWidth = G.width / 2;
    const potHeight = G.height / 2 - tbDim.height;
    const sideLength = Math.min(potWidth, potHeight);
    const gameBody = makeDiv({ width: sideLength, height: sideLength});
    populateGameBoard(gameBody, G.gridSize, G.gridSize);
    document.body.appendChild(gameBody);
    changeSelectionTo(G.selection);
    // TODO: set up an actual puzzle of a board
}
