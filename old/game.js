define(["require", "exports", "./GUITypes"], function (require, exports, GUITypes_1) {
    "use strict";
    exports.__esModule = true;
    function otherView(view) {
        return view === 0 ? 1 : 0;
    }
    function absMod(x, y) {
        return (x + y) % y;
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
            this.isLive = true;
        }
        Globals.prototype.selectedBlocks = function (view, selection) {
            selection = selection || this.selection;
            var ret = [];
            for (var i = 0; i < this.gridSize; ++i) {
                var grid = view === 0 ? this.locGrid : this.colorGrid;
                if (this.viewOfSelectedRow === view) {
                    ret.push(grid[selection[view]][i]);
                }
                else {
                    ret.push(grid[i][selection[view]]);
                }
            }
            return ret;
        };
        Globals.prototype.rotate = function (view, direction, selection) {
            selection = selection || this.selection;
            var blocks = this.selectedBlocks(view, selection);
            var index = 0;
            for (var i = 0; i < blocks.length - 1; ++i) {
                var nextIndex = absMod(index + direction, G.gridSize);
                blocks[index].swapWith(blocks[nextIndex]);
                index = nextIndex;
            }
        };
        Globals.prototype.verifyIfSolved = function () {
            if (!this.isLive) {
                return;
            }
            for (var i = 0; i < this.gridSize; ++i) {
                for (var j = 0; j < this.gridSize; ++j) {
                    var loc = this.locGrid[i][j].colorLoc;
                    if (loc.row !== i || loc.col !== j) {
                        return;
                    }
                }
            }
            setTimeout(function () {
                alert("You won, and I am too lazy to generate a better end condition at this time");
            }, 0);
        };
        Globals.prototype.doNotLive = function (f) {
            this.isLive = false;
            f();
            this.isLive = true;
        };
        return Globals;
    }());
    var G = new Globals();
    var KeyCode;
    (function (KeyCode) {
        KeyCode[KeyCode["Enter"] = 13] = "Enter";
        KeyCode[KeyCode["LeftArrow"] = 37] = "LeftArrow";
        KeyCode[KeyCode["UpArrow"] = 38] = "UpArrow";
        KeyCode[KeyCode["RightArrow"] = 39] = "RightArrow";
        KeyCode[KeyCode["DownArrow"] = 40] = "DownArrow";
        KeyCode[KeyCode["W"] = 'W'.charCodeAt(0)] = "W";
        KeyCode[KeyCode["A"] = 'A'.charCodeAt(0)] = "A";
        KeyCode[KeyCode["S"] = 'S'.charCodeAt(0)] = "S";
        KeyCode[KeyCode["D"] = 'D'.charCodeAt(0)] = "D";
    })(KeyCode || (KeyCode = {}));
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
            this.gridLoc = GUITypes_1.Coords.copy(loc);
            this.colorLoc = GUITypes_1.Coords.copy(loc);
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
            if (this.selectionStatus !== 3) {
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
            this.nodes[0].style.backgroundColor = this.colorLoc.toColor(G.gridSize).toCSSString();
            this.nodes[1].innerHTML = this.gridLoc.toHTMLString();
            this.nodes[1].style.backgroundColor = this.gridLoc.toColor(G.gridSize).toCSSString();
            var styleStr = function (view, status) {
                if (status !== 2 && view !== status) {
                    return "5px solid #0c0c0c";
                }
                else if (view === 0) {
                    return "5px solid #ff00ff";
                }
                else if (view === 1) {
                    return "5px solid #ffff00";
                }
                else {
                    return "";
                }
            };
            for (var _i = 0, _a = [0, 1]; _i < _a.length; _i++) {
                var view = _a[_i];
                this.nodes[view].style.border = styleStr(view, this.selectionStatus);
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
    function onKeyEvent(evt) {
        var pos = [G.selection[0], G.selection[1]];
        switch (evt) {
            case KeyCode.UpArrow:
                pos[G.viewOfSelectedRow] -= 1;
                break;
            case KeyCode.LeftArrow:
                G.rotate(G.viewOfSelectedRow, GUITypes_1.Direction.Up);
                break;
            case KeyCode.RightArrow:
                G.rotate(G.viewOfSelectedRow, GUITypes_1.Direction.Down);
                break;
            case KeyCode.DownArrow:
                pos[G.viewOfSelectedRow] += 1;
                break;
            case KeyCode.W:
                G.rotate(otherView(G.viewOfSelectedRow), GUITypes_1.Direction.Up);
                break;
            case KeyCode.S:
                G.rotate(otherView(G.viewOfSelectedRow), GUITypes_1.Direction.Down);
                break;
            case KeyCode.A:
                pos[otherView(G.viewOfSelectedRow)] -= 1;
                break;
            case KeyCode.D:
                pos[otherView(G.viewOfSelectedRow)] += 1;
                break;
            default:
                return;
        }
        for (var i = 0; i < pos.length; ++i) {
            pos[i] = absMod(pos[i], G.gridSize);
        }
        changeSelectionTo(pos);
        G.verifyIfSolved();
    }
    document.body.onkeydown = function (evt) { onKeyEvent(evt.keyCode); };
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
                var block = new Block(childDims, locDiv, colorDiv, new GUITypes_1.Coords(i, j));
                gridRow.push(block);
                colorRow.push(block);
            }
        }
        rootNode.appendChild(locDiv);
        rootNode.appendChild(colorDiv);
        document.body.appendChild(rootNode);
        changeSelectionTo(G.selection);
    }
    function generateNewPuzzle() {
        var actions = [KeyCode.W, KeyCode.A, KeyCode.S, KeyCode.D,
            KeyCode.UpArrow, KeyCode.DownArrow, KeyCode.LeftArrow, KeyCode.RightArrow];
        G.doNotLive(function () {
            var steps = 5 + Math.floor(Math.random() * 100);
            for (var i = 0; i < steps; ++i) {
                onKeyEvent(actions[Math.floor(Math.random() * actions.length)]);
            }
            changeSelectionTo([0, 0]);
        });
    }
    function main() {
        var tbDim = { width: G.width, height: G.height / 15 };
        var titleBar = makeDiv(tbDim);
        titleBar.innerHTML = "<h1>Left: WASD, Right: Arrow Keys; move selection and rotate row/col</h1>";
        document.body.appendChild(titleBar);
        populateGameBoard({ width: G.width, height: G.height / 2 - tbDim.height });
        generateNewPuzzle();
    }
    document.body.onload = main;
});
