document.body.onload = main;

var G =  {
    width: document.body.getBoundingClientRect().width,
    height: document.body.getBoundingClientRect().height,
    selectedNode: null,
    lastSelectedNode: null,
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

interface Coords {
    row : number;
    col : number;
};

function makeDiv(dim : Dims) : HTMLElement {
    var ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    return ret;
}

function getStyleDimensions(node : HTMLElement) : Dims {
    var widthS  : string = node.style.width.toString();
    var heightS : string = node.style.height.toString();
    return {
        width  : Number(widthS.substring(0, widthS.length - 2)),
        height : Number(heightS.substring(0, widthS.length - 2))
    };
}

class Block {
    loc : Coords;
    node : HTMLElement;
    setDefault = function() {
        this.node.style.border = "1px solid #ccc";
        this.node.style.borderWidth = "1px 1px 1px 1px";
    }

    setSelected = function() {
        this.node.style.border = "5px solid #ff0000";
        this.node.style.borderWidth = "1px 1px 1px 1px";
        G.selectedNode = this;
    }

    constructor(rootNode : HTMLElement, width : number, height : number, _loc : Coords) {
        var block = document.createElement("div");
        var parentDims : Dims = getStyleDimensions(rootNode);
        block.style.cssFloat = "left";
        block.style.width = ((parentDims.width - width*2) / width).toString();
        block.style.height = ((parentDims.height - height*2) / height).toString();

        this.node = block;
        this.node.onclick = () => { this.setSelected() };
        this.loc = Object.assign({}, _loc);
        this.setDefault();
    }
};

document.body.onclick = function() {
    if (G.selectedNode != G.lastSelectedNode) {
        if (G.lastSelectedNode !== null) {
            G.lastSelectedNode.setDefault();
        }
    }
    G.lastSelectedNode = G.selectedNode;
}

document.body.onkeydown = function(evt : KeyboardEvent) {
    if (G.selectedNode == null) {
        return;
    }
    var pos : Coords = Object.assign({}, G.selectedNode.loc);
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
    if (pos.col >= G.grid.length || pos.row >= G.grid[0].length ||
        pos.col < 0 || pos.row < 0) {
        return;
    }

    G.selectedNode.setDefault();
    G.grid[pos.row][pos.col].setSelected();
    G.lastSelectedNode = G.selectedNode;
}

function populateGameBoard(rootNode : HTMLElement, width : number, height : number) {
    for (var i : number = 0; i < height; ++i) {
        var row = [];
        G.grid.push(row);
        for (var j : number = 0; j < width; ++j) {
            var block = new Block(rootNode, width, height, {row : i, col : j});
            row.push(block);
            rootNode.appendChild(block.node);
        }
    }
}

function main() {
    var tbDim : Dims = { width: G.width, height: G.height / 20};
    var titleBar = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Foo</h1>";
    document.body.appendChild(titleBar);
    var potWidth = G.width / 2;
    var potHeight = G.height / 2 - tbDim.height;
    var sideLength = Math.min(potWidth, potHeight);
    var gameBody = makeDiv({ width: sideLength, height: sideLength});
    populateGameBoard(gameBody, 3, 3);
    document.body.appendChild(gameBody);
}
