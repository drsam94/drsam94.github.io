"use strict";
document.body.onload = main;
var G = {
    width: document.body.getBoundingClientRect().width,
    height: document.body.getBoundingClientRect().height,
    selectedNode: null,
    gridSize: 3,
    grid: []
};
var KeyCode;
(function (KeyCode) {
    KeyCode[KeyCode["LeftArrow"] = 37] = "LeftArrow";
    KeyCode[KeyCode["UpArrow"] = 38] = "UpArrow";
    KeyCode[KeyCode["RightArrow"] = 39] = "RightArrow";
    KeyCode[KeyCode["DownArrow"] = 40] = "DownArrow";
})(KeyCode || (KeyCode = {}));
;
;
var Coords = (function () {
    function Coords(row_, col_) {
        this.row = row_;
        this.col = col_;
    }
    Coords.copy = function (other) {
        return new Coords(other.row, other.col);
    };
    Coords.prototype.deltaTo = function (target) {
        return new Coords(target.row - this.row, target.col - this.col);
    };
    Coords.prototype.applyDelta = function (target) {
        return new Coords(((target.row + this.row) + G.gridSize) % G.gridSize, ((target.col + this.col) + G.gridSize) % G.gridSize);
    };
    Coords.prototype.toHTMLString = function () {
        return "<p>(" + this.row.toString() + ", " + this.col.toString() + ")</p>";
    };
    return Coords;
}());
;
function makeDiv(dim) {
    var ret = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    return ret;
}
function getStyleDimensions(node) {
    var widthS = node.style.width.toString();
    var heightS = node.style.height.toString();
    return {
        width: Number(widthS.substring(0, widthS.length - 2)),
        height: Number(heightS.substring(0, widthS.length - 2))
    };
}
var Block = (function () {
    function Block(rootNode, width, height, _loc) {
        var _this = this;
        var block = document.createElement("div");
        var parentDims = getStyleDimensions(rootNode);
        block.style.cssFloat = "left";
        block.style.width = ((parentDims.width - width * 2) / width).toString();
        block.style.height = ((parentDims.height - height * 2) / height).toString();
        this.node = block;
        this.node.onclick = function () { changeSelectionTo(_this); };
        this.gridLoc = Coords.copy(_loc);
        this.origLoc = Coords.copy(_loc);
        this.updateDisplay();
        this.setDefault();
    }
    Block.prototype.setDefault = function () {
        this.node.style.border = "1px solid #ccc";
        this.node.style.borderWidth = "1px 1px 1px 1px";
    };
    Block.prototype.setSelected = function () {
        this.node.style.border = "5px solid #ff0000";
        this.node.style.borderWidth = "1px 1px 1px 1px";
    };
    Block.prototype.updateDisplay = function () {
        this.node.innerHTML = this.origLoc.toHTMLString();
    };
    Block.prototype.swapWith = function (targetLoc) {
        var targetBlock = G.grid[targetLoc.row][targetLoc.col];
        console.log(targetLoc.toHTMLString());
        var tmp = this.origLoc;
        this.origLoc = targetBlock.origLoc;
        targetBlock.origLoc = tmp;
        this.updateDisplay();
        targetBlock.updateDisplay();
    };
    return Block;
}());
;
function changeSelectionTo(targetLoc) {
    if (G.selectedNode == null) {
        targetLoc.setSelected();
        G.selectedNode = targetLoc;
        return;
    }
    G.selectedNode.setDefault();
    var valDiff = G.selectedNode.origLoc.deltaTo(targetLoc.origLoc);
    var movDiff = G.selectedNode.gridLoc.deltaTo(G.selectedNode.gridLoc);
    var totalDiff = movDiff.deltaTo(valDiff);
    var swapLoc = G.selectedNode.gridLoc.applyDelta(totalDiff);
    targetLoc.setSelected();
    targetLoc.swapWith(swapLoc);
    G.selectedNode = targetLoc;
}
document.body.onkeydown = function (evt) {
    if (G.selectedNode == null) {
        return;
    }
    var pos = Coords.copy(G.selectedNode.gridLoc);
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
};
function populateGameBoard(rootNode, width, height) {
    for (var i = 0; i < height; ++i) {
        var row = [];
        G.grid.push(row);
        for (var j = 0; j < width; ++j) {
            var block = new Block(rootNode, width, height, new Coords(i, j));
            row.push(block);
            rootNode.appendChild(block.node);
        }
    }
}
function main() {
    var tbDim = { width: G.width, height: G.height / 20 };
    var titleBar = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Foo</h1>";
    document.body.appendChild(titleBar);
    var potWidth = G.width / 2;
    var potHeight = G.height / 2 - tbDim.height;
    var sideLength = Math.min(potWidth, potHeight);
    var gameBody = makeDiv({ width: sideLength, height: sideLength });
    populateGameBoard(gameBody, G.gridSize, G.gridSize);
    document.body.appendChild(gameBody);
    G.grid[0][0].swapWith(new Coords(2, 1));
}
