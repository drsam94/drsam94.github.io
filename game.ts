document.body.onload = main;

var G =  {
    width: document.body.getBoundingClientRect().width,
    height: document.body.getBoundingClientRect().height,
    selectedNode : null,
    gridSize : 3,
    grid: []
};

enum KeyCode {
    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40
};

interface Dims {
    width : number;
    height : number;
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
};

function makeDiv(dim : Dims) : HTMLElement {
    const ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
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
    origLoc : Coords;
    // Location on grid
    gridLoc : Coords;
    node : HTMLElement;
    setDefault() : void {
        this.node.style.border = "1px solid #ccc";
        this.node.style.borderWidth = "1px 1px 1px 1px";
    }

    setSelected() : void {
        this.node.style.border = "5px solid #ff0000";
        this.node.style.borderWidth = "1px 1px 1px 1px";
    }

    updateDisplay() : void {
        this.node.innerHTML = this.origLoc.toHTMLString();
    }

    swapWith(targetLoc : Coords) : void {
        const targetBlock = G.grid[targetLoc.row][targetLoc.col];
        const tmp : Coords = this.origLoc;
        this.origLoc = targetBlock.origLoc;
        targetBlock.origLoc = tmp;
        this.updateDisplay();
        targetBlock.updateDisplay();
    }

    constructor(rootNode : HTMLElement, width : number, height : number, _loc : Coords) {
        const block = document.createElement("div");
        const parentDims : Dims = getStyleDimensions(rootNode);
        block.style.cssFloat = "left";
        block.style.width = ((parentDims.width - width*2) / width).toString();
        block.style.height = ((parentDims.height - height*2) / height).toString();

        this.node = block;
        this.node.onclick = () => { changeSelectionTo(this); };
        this.gridLoc = Coords.copy(_loc);
        this.origLoc = Coords.copy(_loc);
        this.updateDisplay();
        this.setDefault();
    }
};


function changeSelectionTo(targetLoc : Block) : void {
    if (G.selectedNode == null) {
        targetLoc.setSelected();
        G.selectedNode = targetLoc;
        return;
    }
    G.selectedNode.setDefault();
    // TODO: this leads to many translations of the base board position being stable;
    // hopefully there is a way to tweak this idea into a thing that is actually interesting
    const valDiff = G.selectedNode.origLoc.deltaTo(targetLoc.origLoc);
    const movDiff = G.selectedNode.gridLoc.deltaTo(G.selectedNode.gridLoc);
    const totalDiff = movDiff.deltaTo(valDiff);
    const swapLoc = G.selectedNode.gridLoc.applyDelta(totalDiff);

    targetLoc.setSelected();
    targetLoc.swapWith(swapLoc)
    G.selectedNode = targetLoc;
}

document.body.onkeydown = function(evt : KeyboardEvent) : void  {
    if (G.selectedNode == null) {
        return;
    }
    const pos : Coords = Coords.copy(G.selectedNode.gridLoc);
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
        default:
            return;
    }
    if (pos.col >= G.gridSize || pos.row >= G.gridSize ||
        pos.col < 0 || pos.row < 0) {
        return;
    }
    changeSelectionTo(G.grid[pos.row][pos.col]);
}

function populateGameBoard(rootNode : HTMLElement, width : number, height : number) : void {
    for (let i : number = 0; i < height; ++i) {
        const row = [];
        G.grid.push(row);
        for (let j : number = 0; j < width; ++j) {
            const block = new Block(rootNode, width, height, new Coords(i, j));
            row.push(block);
            rootNode.appendChild(block.node);
        }
    }
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

    // Hack to make a nontrivial board
    G.grid[0][0].swapWith(new Coords(2, 1));
}
