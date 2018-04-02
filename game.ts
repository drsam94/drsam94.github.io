document.body.onload = main;

var G =  {
    width: document.body.getBoundingClientRect().width,
    height: document.body.getBoundingClientRect().height,
    selectedNode: null,
    lastSelectedNode: null
};

interface Dims {
    width : number;
    height : number;
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

function Block(rootNode : HTMLElement, width : number, height : number) {
    var block = document.createElement("div");
    var parentDims : Dims = getStyleDimensions(rootNode);
    block.style.cssFloat = "left";
    block.style.width = ((parentDims.width - width*2) / width).toString();
    block.style.height = (parentDims.height / height).toString();

    this.node = block;
    this.node.onclick = () => { this.setSelected() };
    this.setDefault();
}

Block.prototype.setDefault =  function() {
    this.node.style.border = "1px solid #ccc";
    this.node.style.borderWidth = "1px 1px 1px 1px";
};

Block.prototype.setSelected = function() {
    this.node.style.border = "5px solid #ff0000";
    this.node.style.borderWidth = "1px 1px 1px 1px";
    G.selectedNode = this;
};

document.body.onclick = function() {
    if (G.selectedNode != G.lastSelectedNode) {
        if (G.lastSelectedNode !== null) {
            G.lastSelectedNode.setDefault();
        }
    }
    G.lastSelectedNode = G.selectedNode;
}

function populateGameBoard(rootNode : HTMLElement, width : number, height : number) {
    for (var i : number = 0; i < height; ++i) {
        for (var j : number = 0; j < width; ++j) {
            rootNode.appendChild((new Block(rootNode, width, height)).node);
        }
    }
}

function main() {
    var tbDim : Dims = { width: G.width, height: G.height / 20};
    var titleBar = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Foo</h1>";
    document.body.appendChild(titleBar);
    var gameBody = makeDiv({ width: G.width, height: G.height - tbDim.height});
    populateGameBoard(gameBody, 5, 5);
    document.body.appendChild(gameBody);
}
