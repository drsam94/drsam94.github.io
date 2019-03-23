define("GUITypes", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
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
        Color.white = function () {
            return new Color(255, 255, 255);
        };
        Color.black = function () {
            return new Color(0.0, 0.0, 0.0);
        };
        Color.red = function () {
            return new Color(255, 0.0, 0.0);
        };
        Color.green = function () {
            return new Color(0.0, 255, 0.0);
        };
        Color.blue = function () {
            return new Color(0.0, 0.0, 255);
        };
        return Color;
    }());
    exports.Color = Color;
    var allColors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
    var Coords = (function () {
        function Coords(row_, col_) {
            this.row = row_;
            this.col = col_;
        }
        Coords.copy = function (other) {
            return new Coords(other.row, other.col);
        };
        Coords.prototype.toHTMLString = function () {
            return "<p>(" + this.row.toString() + ", " + this.col.toString() + ")</p>";
        };
        Coords.prototype.toColor = function (maxScale) {
            return allColors[this.row].mul((this.col + 1) / maxScale);
        };
        return Coords;
    }());
    exports.Coords = Coords;
});
define("game3", ["require", "exports", "GUITypes"], function (require, exports, GUITypes_1) {
    "use strict";
    exports.__esModule = true;
    var Globals = (function () {
        function Globals() {
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
        Globals.prototype.setCursor = function (blk) {
            if (this.cursor !== undefined) {
                this.cursor.setSelected(false);
            }
            this.cursor = blk;
            this.cursor.setSelected(true);
        };
        Globals.prototype.getCursor = function () {
            if (this.cursor === undefined) {
                throw new Error("no cursor");
            }
            else {
                return this.cursor;
            }
        };
        Globals.prototype.makeMove = function (dir) {
            G.allowInput = false;
            var blck = this.getBlockInDirection(this.getCursor().loc, dir);
            if (blck !== null) {
                this.setCursor(blck);
            }
            G.allowInput = true;
        };
        Globals.prototype.checkWin = function () {
            var puzzle = this.levels[this.currentPuzzleIdx];
            for (var i = 0; i < this.grid.length; i += 1) {
                for (var j = 0; j < this.grid.length; j += 1) {
                    var state = this.grid[i][j].state;
                    var c = puzzle[i].charAt(j);
                    if (c === "1" && state !== BlockType.Filled) {
                        return;
                    }
                }
            }
            this.youWin();
        };
        Globals.prototype.isInputAllowed = function () {
            return this.allowInput;
        };
        Globals.prototype.setState = function (loc, state) {
            var block = this.grid[loc.row][loc.col];
            block.state = state;
            block.updateDisplay();
        };
        Globals.prototype.toggleCurrent = function (active) {
            var type = (function (ty) {
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
        };
        Globals.prototype.resetPuzzle = function (puzzle) {
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
            for (var i = 0; i < G.gridSize; ++i) {
                for (var j = 0; j < G.gridSize; ++j) {
                    G.setState(new GUITypes_1.Coords(i, j), BlockType.Empty);
                }
            }
            if (G.labels) {
                G.labels.setLabels(puzzle);
            }
        };
        Globals.prototype.randomPuzzle = function (dims) {
            var rows = [];
            for (var i = 0; i < dims.height; ++i) {
                var row = "";
                for (var j = 0; j < dims.width; ++j) {
                    row += (Math.random() > 0.5) ? "0" : "1";
                }
                rows.push(row);
            }
            return rows;
        };
        Globals.prototype.loadPuzzles = function () {
            this.levels = [this.randomPuzzle({ width: 10, height: 10 })];
        };
        Globals.prototype.currentPuzzle = function () {
            return this.levels[this.currentPuzzleIdx];
        };
        Globals.prototype.youWin = function () {
            var _this = this;
            setTimeout(function () {
                alert("You won, yay");
                _this.currentPuzzleIdx++;
                _this.currentPuzzleIdx %= _this.levels.length;
                _this.resetPuzzle();
            }, 0);
        };
        Globals.prototype.getBlockInDirection = function (loc, dir) {
            var place = GUITypes_1.Coords.copy(loc);
            switch (dir) {
                case 1:
                    place.row -= 1;
                    break;
                case -1:
                    place.row += 1;
                    break;
                case -2:
                    place.col -= 1;
                    break;
                case 2:
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
        KeyCode[KeyCode["R"] = 'R'.charCodeAt(0)] = "R";
        KeyCode[KeyCode["Z"] = 'Z'.charCodeAt(0)] = "Z";
        KeyCode[KeyCode["X"] = 'X'.charCodeAt(0)] = "X";
    })(KeyCode || (KeyCode = {}));
    function makeDiv(dim) {
        var ret = document.createElement("div");
        ret.style.width = dim.width.toString();
        ret.style.height = dim.height.toString();
        ret.style.cssFloat = "left";
        return ret;
    }
    function makeBlock(parentDims) {
        var ret = makeDiv({
            width: (parentDims.width) / (G.gridSize + 1) - 11,
            height: (parentDims.height) / (G.gridSize + 1) - 11
        });
        ret.style.borderWidth = "5px 5px 5px 5px";
        ret.style.border = "5px solid #FFFFFF";
        return ret;
    }
    var BlockType;
    (function (BlockType) {
        BlockType[BlockType["Empty"] = 0] = "Empty";
        BlockType[BlockType["Filled"] = 1] = "Filled";
        BlockType[BlockType["Flagged"] = 2] = "Flagged";
    })(BlockType || (BlockType = {}));
    var Label = (function () {
        function Label(parentDims, parent) {
            this.node = makeBlock(parentDims);
            this.node.style.textAlign = "center";
            parent.appendChild(this.node);
        }
        Label.prototype.setLabel = function (lbl, vertical) {
            var joinChar = vertical ? "</br>" : " ";
            this.node.innerHTML = lbl.join(joinChar);
            if (lbl.length === 0) {
                this.node.textContent = "_";
            }
        };
        return Label;
    }());
    var Labels = (function () {
        function Labels() {
            this.rows = [];
            this.cols = [];
        }
        Labels.prototype.addLabel = function (parentDims, parent, isRow) {
            var newLabel = new Label(parentDims, parent);
            var arr = isRow ? this.rows : this.cols;
            arr.push(newLabel);
        };
        Labels.prototype.setLabels = function (puzzle) {
            if (this.rows.length !== puzzle.length || this.cols.length !== puzzle[0].length) {
                throw new Error("Bad puzzle dimensions");
            }
            var colStrs = [];
            for (var _i = 0, _a = this.cols; _i < _a.length; _i++) {
                var _ = _a[_i];
                colStrs.push("");
            }
            for (var i = 0; i < this.rows.length; i += 1) {
                var row = puzzle[i];
                this.rows[i].setLabel(Labels.getLabel(row), false);
                for (var j = 0; j < this.cols.length; j += 1) {
                    colStrs[j] += row[j];
                }
            }
            for (var i = 0; i < this.cols.length; i += 1) {
                this.cols[i].setLabel(Labels.getLabel(colStrs[i]), true);
            }
        };
        Labels.getLabel = function (data) {
            var ret = [];
            var current = 0;
            for (var i = 0; i < data.length; i += 1) {
                if (data.charAt(i) === '0') {
                    if (current > 0) {
                        ret.push(current);
                    }
                    current = 0;
                }
                else {
                    current += 1;
                }
            }
            if (current > 0) {
                ret.push(current);
            }
            return ret;
        };
        return Labels;
    }());
    var Block = (function () {
        function Block(parentDims, parent, loc) {
            this.node = makeBlock(parentDims);
            this.loc = GUITypes_1.Coords.copy(loc);
            parent.appendChild(this.node);
            this.node.style.borderWidth = "5px 5px 5px 5px";
            this.node.style.border = "5px solid #0c0c0c";
            this.state = BlockType.Empty;
            this.updateDisplay();
        }
        Block.prototype.updateDisplay = function () {
            var col;
            switch (this.state) {
                case BlockType.Empty:
                    col = GUITypes_1.Color.white();
                    break;
                case BlockType.Filled:
                    col = GUITypes_1.Color.blue();
                    break;
                case BlockType.Flagged:
                    col = GUITypes_1.Color.red();
                    break;
                default:
                    throw new Error("Bad blocktype " + this.state);
            }
            this.node.style.backgroundColor = col.toCSSString();
        };
        Block.prototype.setSelected = function (isSelected) {
            if (!isSelected) {
                this.node.style.border = "5px solid #0c0c0c";
            }
            else {
                this.node.style.border = "5px solid #cc0001";
            }
        };
        return Block;
    }());
    function onKeyEvent(evt) {
        if (!G.isInputAllowed()) {
            return;
        }
        var dir;
        switch (evt) {
            case KeyCode.UpArrow:
            case KeyCode.W:
                dir = 1;
                break;
            case KeyCode.LeftArrow:
            case KeyCode.A:
                dir = -2;
                break;
            case KeyCode.RightArrow:
            case KeyCode.D:
                dir = 2;
                break;
            case KeyCode.DownArrow:
            case KeyCode.S:
                dir = -1;
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
    document.body.onkeydown = function (evt) { onKeyEvent(evt.keyCode); };
    function populateGameBoard(rootDims) {
        G.labels = new Labels();
        var rootNode = makeDiv(rootDims);
        var childDims = { width: rootDims.height, height: rootDims.height };
        var locDiv = makeDiv(childDims);
        var topLabelDiv = makeDiv({ width: rootDims.width, height: childDims.height / 5 });
        var topLeftCorner = makeBlock(childDims);
        topLeftCorner.textContent = "*";
        topLabelDiv.appendChild(topLeftCorner);
        for (var i = 0; i < G.gridSize; ++i) {
            G.labels.addLabel(childDims, topLabelDiv, false);
        }
        for (var i = 0; i < G.gridSize; ++i) {
            var gridRow = [];
            G.grid.push(gridRow);
            G.labels.addLabel(childDims, locDiv, true);
            for (var j = 0; j < G.gridSize; ++j) {
                var block = new Block(childDims, locDiv, new GUITypes_1.Coords(i, j));
                gridRow.push(block);
            }
        }
        G.setCursor(G.grid[0][0]);
        rootNode.appendChild(topLabelDiv);
        rootNode.appendChild(locDiv);
        document.body.appendChild(rootNode);
    }
    var once = false;
    function main() {
        if (once) {
            return;
        }
        else {
            once = true;
        }
        var tbDim = { width: G.width, height: G.height / 7 };
        var titleBar = makeDiv(tbDim);
        titleBar.innerHTML = "<h1>Picross. </br> </h1>";
        document.body.appendChild(titleBar);
        populateGameBoard({ width: G.width, height: G.height / 1.5 - tbDim.height });
        G.loadPuzzles();
        G.resetPuzzle();
    }
    document.body.onload = main;
});
