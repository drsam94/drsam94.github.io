"use strict";
document.body.onload = main;
var Color = (function () {
    function Color(red, green, blue) {
        this.r = red;
        this.g = green;
        this.b = blue;
    }
    Color.prototype.toCSSString = function () {
        return "rgba(" + this.r.toString() + ", " +
            this.g.toString() + ", " +
            this.b.toString() + ", 1.0)";
    };
    Color.prototype.mul = function (x) {
        return new Color(Math.round(this.r * x), Math.round(this.g * x), Math.round(this.b * x));
    };
    return Color;
}());
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
    Coords.prototype.toColor = function () {
        return G.colors[this.row].mul((this.col + 1) / G.gridSize);
    };
    Coords.prototype.wrap = function (size) {
        if (this.row < 0) {
            this.row = size - 1;
        }
        else if (this.row == size) {
            this.row = 0;
        }
        if (this.col < 0) {
            this.col = size - 1;
        }
        else if (this.col == size) {
            this.col = 0;
        }
    };
    return Coords;
}());
;
var Globals = (function () {
    function Globals() {
        this.width = document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.selection = new Coords(0, 0);
        this.gridSize = 3;
        this.locGrid = [];
        this.colorGrid = [];
        this.colors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
    }
    Globals.prototype.selectedCol = function () {
        var ret = [];
        for (var i = 0; i < this.gridSize; ++i) {
            ret.push(this.locGrid[i][this.selection.col]);
        }
        return ret;
    };
    return Globals;
}());
;
var G = new Globals();
var KeyCode;
(function (KeyCode) {
    KeyCode[KeyCode["Enter"] = 13] = "Enter";
    KeyCode[KeyCode["LeftArrow"] = 37] = "LeftArrow";
    KeyCode[KeyCode["UpArrow"] = 38] = "UpArrow";
    KeyCode[KeyCode["RightArrow"] = 39] = "RightArrow";
    KeyCode[KeyCode["DownArrow"] = 40] = "DownArrow";
})(KeyCode || (KeyCode = {}));
;
;
function makeDiv(dim) {
    var ret = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
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
        var parentDims = getStyleDimensions(rootNode);
        var block = makeDiv({ width: (parentDims.width - width * 5 * 6) / width,
            height: (parentDims.height - height * 5 * 6) / height });
        this.node = block;
        this.node.onclick = function () { changeSelectionTo(new Coords(_this.colorLoc.row, _this.gridLoc.col)); };
        this.gridLoc = Coords.copy(_loc);
        this.colorLoc = Coords.copy(_loc);
        this.setDefault();
    }
    Block.prototype.setDefault = function () {
        this.node.style.border = "1px solid #ccc";
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.updateDisplay();
    };
    Block.prototype.setSelected = function () {
        this.node.style.border = "1px solid #ff00ff";
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.updateDisplay();
    };
    Block.prototype.updateDisplay = function () {
        this.node.innerHTML = this.colorLoc.toHTMLString();
        this.node.style.backgroundColor = this.colorLoc.toColor().toCSSString();
    };
    Block.prototype.swapWith = function (targetLoc) {
        var targetBlock = G.locGrid[targetLoc.row][targetLoc.col];
        var tmp = this.colorLoc;
        this.colorLoc = targetBlock.colorLoc;
        targetBlock.colorLoc = tmp;
        this.updateDisplay();
        targetBlock.updateDisplay();
    };
    return Block;
}());
;
function changeSelectionTo(newSelection) {
    for (var _i = 0, _a = G.selectedCol(); _i < _a.length; _i++) {
        var block = _a[_i];
        block.setDefault();
    }
    G.selection = newSelection;
    for (var _b = 0, _c = G.selectedCol(); _b < _c.length; _b++) {
        var block = _c[_b];
        block.setSelected();
    }
}
document.body.onkeydown = function (evt) {
    var pos = Coords.copy(G.selection);
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
        default:
            return;
    }
    pos.wrap(G.gridSize);
    changeSelectionTo(pos);
};
function populateGameBoard(rootNode, width, height) {
    for (var i = 0; i < height; ++i) {
        var row = [];
        G.locGrid.push(row);
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
    changeSelectionTo(G.selection);
}
