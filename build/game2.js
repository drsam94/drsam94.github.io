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
define("game2", ["require", "exports", "GUITypes"], function (require, exports, GUITypes_1) {
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
            this.currentPuzzle = [];
        }
        Globals.prototype.makeMove = function (dir) {
            G.allowInput = false;
            this.setPlayerSquaresEmpty();
            while (this.moveSingle(dir)) {
            }
            this.postMoveUpdate(dir);
            G.allowInput = true;
        };
        Globals.prototype.isInputAllowed = function () {
            return this.allowInput;
        };
        Globals.prototype.setState = function (loc, state) {
            var block = this.grid[loc.row][loc.col];
            block.state = state;
            if (state === BlockType.Player) {
                this.playerSquares.push(GUITypes_1.Coords.copy(loc));
            }
            block.updateDisplay();
        };
        Globals.prototype.resetPuzzle = function (puzzle) {
            puzzle = puzzle || this.currentPuzzle;
            this.playerSquares = [];
            this.allowInput = true;
            if (puzzle.length !== G.gridSize || puzzle[0].length !== G.gridSize) {
                throw new Error("Bad puzzle size");
            }
            for (var i = 0; i < G.gridSize; ++i) {
                for (var j = 0; j < G.gridSize; ++j) {
                    G.setState(new GUITypes_1.Coords(i, j), puzzle[i].charCodeAt(j));
                }
            }
            this.currentPuzzle = puzzle;
        };
        Globals.prototype.setPlayerSquaresEmpty = function () {
            for (var _i = 0, _a = this.playerSquares; _i < _a.length; _i++) {
                var pSquare = _a[_i];
                this.grid[pSquare.row][pSquare.col].state = BlockType.Empty;
            }
        };
        Globals.prototype.youWin = function () {
            setTimeout(function () {
                alert("You won, yay");
            }, 0);
        };
        Globals.prototype.postMoveUpdate = function (dir) {
            for (var _i = 0, _a = this.playerSquares; _i < _a.length; _i++) {
                var pSquare = _a[_i];
                var current = this.grid[pSquare.row][pSquare.col];
                if (current.state === BlockType.Target) {
                    this.youWin();
                }
                current.state = BlockType.Player;
                var border = this.getBlockInDirection(pSquare, dir);
                if (border !== null) {
                    if (border.state === BlockType.Convertable) {
                        this.setState(border.loc, BlockType.Player);
                    }
                    else if (border.state === BlockType.Target) {
                        this.youWin();
                    }
                }
            }
            for (var _b = 0, _c = this.grid; _b < _c.length; _b++) {
                var blockRow = _c[_b];
                for (var _d = 0, blockRow_1 = blockRow; _d < blockRow_1.length; _d++) {
                    var block = blockRow_1[_d];
                    block.updateDisplay();
                }
            }
        };
        Globals.prototype.moveSingle = function (dir) {
            var nextSquares = [];
            for (var _i = 0, _a = this.playerSquares; _i < _a.length; _i++) {
                var pSquare = _a[_i];
                var nextBlock = this.getBlockInDirection(pSquare, dir);
                if (nextBlock === null || nextBlock.state === BlockType.Obstacle
                    || nextBlock.state === BlockType.Convertable) {
                    return false;
                }
                nextSquares.push(nextBlock.loc);
            }
            this.playerSquares = nextSquares;
            return true;
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
    })(KeyCode || (KeyCode = {}));
    function makeDiv(dim) {
        var ret = document.createElement("div");
        ret.style.width = dim.width.toString();
        ret.style.height = dim.height.toString();
        ret.style.cssFloat = "left";
        return ret;
    }
    var BlockType;
    (function (BlockType) {
        BlockType[BlockType["Empty"] = 'e'.charCodeAt(0)] = "Empty";
        BlockType[BlockType["Obstacle"] = 'o'.charCodeAt(0)] = "Obstacle";
        BlockType[BlockType["Player"] = 'p'.charCodeAt(0)] = "Player";
        BlockType[BlockType["Target"] = 't'.charCodeAt(0)] = "Target";
        BlockType[BlockType["Convertable"] = 'c'.charCodeAt(0)] = "Convertable";
    })(BlockType || (BlockType = {}));
    var Block = (function () {
        function Block(parentDims, parent, loc) {
            var makeBlock = function () {
                return makeDiv({ width: (parentDims.width) / G.gridSize - 10,
                    height: (parentDims.height) / G.gridSize - 10 });
            };
            this.node = makeBlock();
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
                case BlockType.Obstacle:
                    col = GUITypes_1.Color.black();
                    break;
                case BlockType.Player:
                    col = GUITypes_1.Color.red();
                    break;
                case BlockType.Target:
                    col = GUITypes_1.Color.blue();
                    break;
                case BlockType.Convertable:
                    col = GUITypes_1.Color.green();
                    break;
                default:
                    throw new Error("Bad blocktype " + this.state);
            }
            this.node.style.backgroundColor = col.toCSSString();
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
            default:
                return;
        }
        G.makeMove(dir);
    }
    document.body.onkeydown = function (evt) { onKeyEvent(evt.keyCode); };
    function populateGameBoard(rootDims) {
        var rootNode = makeDiv(rootDims);
        var childDims = { width: rootDims.height, height: rootDims.height };
        var locDiv = makeDiv(childDims);
        for (var i = 0; i < G.gridSize; ++i) {
            var gridRow = [];
            G.grid.push(gridRow);
            for (var j = 0; j < G.gridSize; ++j) {
                var block = new Block(childDims, locDiv, new GUITypes_1.Coords(i, j));
                gridRow.push(block);
            }
        }
        rootNode.appendChild(locDiv);
        document.body.appendChild(rootNode);
    }
    var level1 = [
        "peeeceeeee",
        "oeeceeeeee",
        "oeeoeeeecc",
        "eeeeeeeeee",
        "oeeeeccooo",
        "eeeeeeeoee",
        "eeeeeeeooo",
        "coooeeeeee",
        "eeeeeeeeee",
        "eeeeeceeet"
    ];
    function main() {
        var tbDim = { width: G.width, height: G.height / 7 };
        var titleBar = makeDiv(tbDim);
        titleBar.innerHTML = "<h1>You are red. Goal is blue. Obstacles are black. </br>" +
            "Joinable obstacles are green. Use arrow keys. R to reset</h1>";
        document.body.appendChild(titleBar);
        populateGameBoard({ width: G.width, height: G.height / 1.5 - tbDim.height });
        G.resetPuzzle(level1);
    }
    document.body.onload = main;
});
