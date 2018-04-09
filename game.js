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
    return Coords;
}());
;
;
function otherView(view) {
    return view == 0 ? 1 : 0;
}
var Globals = (function () {
    function Globals() {
        this.width = document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.selection = [0, 0];
        this.viewOfSelectedRow = 1;
        this.gridSize = 3;
        this.locGrid = [];
        this.colorGrid = [];
        this.colors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
    }
    Globals.prototype.selectedBlocks = function (view, selection) {
        selection = selection || this.selection;
        var ret = [];
        for (var i = 0; i < this.gridSize; ++i) {
            var grid = view == 0 ? this.locGrid : this.colorGrid;
            if (this.viewOfSelectedRow == view) {
                ret.push(grid[selection[view]][i]);
            }
            else {
                ret.push(grid[i][selection[view]]);
            }
        }
        return ret;
    };
    Globals.prototype.changeSelectionOrientation = function () {
        this.viewOfSelectedRow = otherView(this.viewOfSelectedRow);
    };
    return Globals;
}());
;
var G = new Globals();
;
;
function makeDiv(dim) {
    var ret = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
    return ret;
}
var Block = (function () {
    function Block(parentDims, locParent, colorParent, loc) {
        var makeBlock = function () {
            return makeDiv({ width: (parentDims.width - G.gridSize * 5 * 6) / G.gridSize,
                height: (parentDims.height - G.gridSize * 5 * 6) / G.gridSize });
        };
        this.nodes = new Array(2);
        this.nodes[0] = makeBlock();
        this.nodes[1] = makeBlock();
        this.gridLoc = Coords.copy(loc);
        this.colorLoc = Coords.copy(loc);
        locParent.appendChild(this.nodes[0]);
        colorParent.appendChild(this.nodes[1]);
        for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
            var node = _a[_i];
            node.style.borderWidth = "5px 5px 5px 5px";
        }
        this.selectionStatus = 3;
        this.setDefault();
    }
    Block.prototype.setDefault = function () {
        this.selectionStatus = 3;
        for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
            var node = _a[_i];
            node.style.border = "1px solid #ccc";
            node.style.borderWidth = "5px 5px 5px 5px";
        }
        this.updateDisplay();
    };
    Block.prototype.setSelected = function (type) {
        if (this.selectionStatus != 3) {
            this.selectionStatus = 2;
        }
        else {
            this.selectionStatus = type;
        }
        this.updateDisplay();
    };
    Block.prototype.updateDisplay = function () {
        G.colorGrid[this.colorLoc.row][this.colorLoc.col] = this;
        this.nodes[0].innerHTML = this.colorLoc.toHTMLString();
        this.nodes[0].style.backgroundColor = this.colorLoc.toColor().toCSSString();
        this.nodes[1].innerHTML = this.gridLoc.toHTMLString();
        this.nodes[1].style.backgroundColor = this.gridLoc.toColor().toCSSString();
        var styleStr = (function (status) {
            switch (status) {
                case 0:
                    return "5px solid #ff00ff";
                case 1:
                    return "5px solid #ffff00";
                case 2:
                    return "5px solid #00ffff";
                case 3:
                default:
                    return "5px solid #0c0c0c";
            }
        })(this.selectionStatus);
        for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
            var node = _a[_i];
            node.style.border = styleStr;
        }
    };
    Block.prototype.swapWith = function (other) {
        var tmp = this.colorLoc;
        this.colorLoc = other.colorLoc;
        other.colorLoc = tmp;
        var tmp2 = this.nodes[1];
        this.nodes[1] = other.nodes[1];
        other.nodes[1] = tmp2;
        this.setDefault();
        this.updateDisplay();
        other.setDefault();
        other.updateDisplay();
    };
    return Block;
}());
;
function changeSelectionTo(newSelection) {
    for (var _i = 0, _a = [0, 1]; _i < _a.length; _i++) {
        var view = _a[_i];
        for (var _b = 0, _c = G.selectedBlocks(view); _b < _c.length; _b++) {
            var block = _c[_b];
            block.setDefault();
        }
    }
    G.selection = newSelection;
    for (var _d = 0, _e = [0, 1]; _d < _e.length; _d++) {
        var view = _e[_d];
        for (var _f = 0, _g = G.selectedBlocks(view); _f < _g.length; _f++) {
            var block = _g[_f];
            block.setSelected(view);
        }
    }
}
function performSwap(selection) {
    for (var _i = 0, _a = [0, 1]; _i < _a.length; _i++) {
        var view = _a[_i];
        for (var _b = 0, _c = G.selectedBlocks(view); _b < _c.length; _b++) {
            var block = _c[_b];
            block.setDefault();
        }
    }
    var gridBlocks = G.selectedBlocks(0, selection);
    var colorBlocks = G.selectedBlocks(1, selection);
    for (var i = 0; i < G.gridSize; ++i) {
        gridBlocks[i].swapWith(colorBlocks[i]);
    }
    G.changeSelectionOrientation();
}
document.body.onkeydown = function (evt) {
    var pos = [G.selection[0], G.selection[1]];
    switch (evt.keyCode) {
        case 38:
            pos[G.viewOfSelectedRow] -= 1;
            break;
        case 37:
            pos[otherView(G.viewOfSelectedRow)] -= 1;
            break;
        case 39:
            pos[otherView(G.viewOfSelectedRow)] += 1;
            break;
        case 40:
            pos[G.viewOfSelectedRow] += 1;
            break;
        case 13:
            performSwap(pos);
            break;
        default:
            return;
    }
    for (var i = 0; i < pos.length; ++i) {
        if (pos[i] < 0) {
            pos[i] = G.gridSize - 1;
        }
        else if (pos[i] == G.gridSize) {
            pos[i] = 0;
        }
    }
    changeSelectionTo(pos);
};
function populateGameBoard(rootDims) {
    var rootNode = makeDiv(rootDims);
    var childDims = { width: rootDims.height, height: rootDims.height };
    var locDiv = makeDiv(childDims);
    var colorDiv = makeDiv(childDims);
    for (var i = 0; i < G.gridSize; ++i) {
        var gridRow = [];
        var colorRow = [];
        G.locGrid.push(gridRow);
        G.colorGrid.push(colorRow);
        for (var j = 0; j < G.gridSize; ++j) {
            var block = new Block(childDims, locDiv, colorDiv, new Coords(i, j));
            gridRow.push(block);
            colorRow.push(block);
        }
    }
    rootNode.appendChild(locDiv);
    rootNode.appendChild(colorDiv);
    document.body.appendChild(rootNode);
    changeSelectionTo(G.selection);
}
function main() {
    var tbDim = { width: G.width, height: G.height / 15 };
    var titleBar = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Foo</h1>";
    document.body.appendChild(titleBar);
    populateGameBoard({ width: G.width, height: G.height / 2 - tbDim.height });
    performSwap([1, 1]);
    G.viewOfSelectedRow = 0;
    changeSelectionTo(G.selection);
}
