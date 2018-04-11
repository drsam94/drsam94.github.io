document.body.onload = main;

class Color {
    public r : number;
    public g : number;
    public b : number;

    constructor(red : number, green : number, blue : number) {
        this.r = red;
        this.g = green;
        this.b = blue;
    }

    public toCSSString() : string {
        return "rgba(" + this.r.toString() + ", " +
                         this.g.toString() + ", " +
                         this.b.toString() + ", 1.0)";
    }

    public mul(x : number) : Color {
        return new Color(Math.round(this.r * x),
                         Math.round(this.g * x),
                         Math.round(this.b * x));
    }
}

class Coords {
    public row : number;
    public col : number;
    constructor(row_ : number, col_ : number) {
        this.row = row_;
        this.col = col_;
    }

    // Meant to be used as a copy contructor
    public static copy(other : Coords) : Coords {
        return new Coords(other.row, other.col);
    }

    public toHTMLString() : string {
        return "<p>(" + this.row.toString() + ", " + this.col.toString() + ")</p>";
    }

    // row -> color
    // col -> scale
    public toColor() : Color {
        return G.colors[this.row].mul((this.col + 1) / G.gridSize);
    }
}

const enum View {
    Grid = 0,
    Color = 1,
    Both = 2,
    None = 3
}

function otherView(view : View) : View {
    return view === View.Grid ? View.Color : View.Grid;
}

/// Singleton class for storing various globals
class Globals {
    public width : number;
    public height : number;
    public selection : [number, number];
    public readonly gridSize : number;
    public readonly locGrid : Block[][];
    public readonly colorGrid : Block[][];
    public readonly colors : Color[];
    // This has been non-constant in some intermediate implementations
    public readonly viewOfSelectedRow : View;

    constructor() {
        this.width =  document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.selection = [0, 0];
        this.viewOfSelectedRow = View.Color;
        this.gridSize = 3;
        this.locGrid = [];
        this.colorGrid = [];
        this.colors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
    }

    public selectedBlocks(view : View, selection? : [number, number]) : Block[] {
        selection = selection || this.selection;
        const ret : Block[] = [];
        for (let i = 0; i < this.gridSize; ++i) {
            const grid : Block[][] = view === View.Grid ? this.locGrid : this.colorGrid;
            if (this.viewOfSelectedRow === view) {
                ret.push(grid[selection[view]][i]);
            } else {
                ret.push(grid[i][selection[view]]);
            }
        }
        return ret;
    }

}

const G = new Globals();

const enum KeyCode {
    Enter = 13,
    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40
}

interface Dims {
    width : number;
    height : number;
}

function makeDiv(dim : Dims) : HTMLElement {
    const ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
    return ret;
}

class Block {
    // Display value / location in the solution
    private colorLoc : Coords;
    // Location on grid
    private gridLoc : Coords;

    private readonly nodes : HTMLElement[];
    private selectionStatus : View;
    public setDefault() : void {
        this.selectionStatus = View.None;
        for (const node of this.nodes) {
            node.style.border = "1px solid #ccc";
            node.style.borderWidth = "5px 5px 5px 5px";
        }
        this.updateDisplay();
    }

    public setSelected(type : View) : void {
        if (this.selectionStatus !== View.None) {
            this.selectionStatus = View.Both;
        } else {
            this.selectionStatus = type;
        }
        this.updateDisplay();
    }

    public updateDisplay() : void {
        G.colorGrid[this.colorLoc.row][this.colorLoc.col] = this;
        this.nodes[View.Grid].innerHTML = this.colorLoc.toHTMLString();
        this.nodes[View.Grid].style.backgroundColor = this.colorLoc.toColor().toCSSString();
        this.nodes[View.Color].innerHTML = this.gridLoc.toHTMLString();
        this.nodes[View.Color].style.backgroundColor = this.gridLoc.toColor().toCSSString();
        const styleStr : string = (function(status : View) : string {
            switch (status) {
                case View.Grid:
                    return "5px solid #ff00ff";
                case View.Color:
                    return "5px solid #ffff00";
                case View.Both:
                    return "5px solid #00ffff";
                case View.None:
                default:
                    return "5px solid #0c0c0c";
            }
        })(this.selectionStatus);
        for (const node of this.nodes) {
            node.style.border = styleStr;
        }
    }

    public swapWith(other : Block) : void {
        // What is the cleanest, most idiomatic way to do this in Javascript?
        // std::swap(this.colorLoc, other.colorLoc);
        // std::swap(this.node[View.Color], other.nodes[View.Color]);
        const tmp : Coords = this.colorLoc;
        this.colorLoc = other.colorLoc;
        other.colorLoc = tmp;
        const tmp2 : HTMLElement = this.nodes[View.Color];
        this.nodes[View.Color] = other.nodes[View.Color];
        other.nodes[View.Color] = tmp2;
        this.setDefault();
        this.updateDisplay();
        other.setDefault();
        other.updateDisplay();
    }

    constructor(parentDims : Dims, locParent : HTMLElement, colorParent : HTMLElement, loc : Coords) {
        const makeBlock = function() : HTMLElement {
                      return makeDiv({ width  :  (parentDims.width - G.gridSize * 5 * 6) / G.gridSize,
                                       height :  (parentDims.height - G.gridSize * 5 * 6) / G.gridSize });
                      };

        this.nodes = new Array(2);
        this.nodes[View.Grid] = makeBlock();
        this.nodes[View.Color] = makeBlock();
        this.gridLoc = Coords.copy(loc);
        this.colorLoc = Coords.copy(loc);
        locParent.appendChild(this.nodes[View.Grid]);
        colorParent.appendChild(this.nodes[View.Color]);
        for (const node of this.nodes) {
            node.style.borderWidth = "5px 5px 5px 5px";
        }
        this.selectionStatus = View.None;
        this.setDefault();
    }
}

function changeSelectionTo(newSelection : [number, number]) : void {
    for (const view of [View.Grid, View.Color]) {
        for (const block of G.selectedBlocks(view)) {
            block.setDefault();
        }
    }
    G.selection = newSelection;
    for (const view of [View.Grid, View.Color]) {
        for (const block of G.selectedBlocks(view)) {
            block.setSelected(view);
        }
    }
}

function performSwap(selection : [number, number]) : void {
    for (const view of [View.Grid, View.Color]) {
        for (const block of G.selectedBlocks(view)) {
            block.setDefault();
        }
    }
    const gridBlocks : Block[]  = G.selectedBlocks(View.Grid, selection);
    const colorBlocks : Block[] = G.selectedBlocks(View.Color, selection);
    for (let i = 0; i < G.gridSize; ++i) {
        gridBlocks[i].swapWith(colorBlocks[i]);
    }
}

document.body.onkeydown = function(evt : KeyboardEvent) : void  {
    const pos : [number, number] = [G.selection[0], G.selection[1]];
    switch (evt.keyCode) {
        case KeyCode.UpArrow:
            pos[G.viewOfSelectedRow] -= 1;
            break;
        case KeyCode.LeftArrow:
            pos[otherView(G.viewOfSelectedRow)] -= 1;
            break;
        case KeyCode.RightArrow:
            pos[otherView(G.viewOfSelectedRow)] += 1;
            break;
        case KeyCode.DownArrow:
            pos[G.viewOfSelectedRow] += 1;
            break;
        case KeyCode.Enter:
            performSwap(pos);
            break;
        default:
            return;
    }
    // Wrap selection around grid if needed
    for (let i = 0; i < pos.length; ++i) {
        if (pos[i] < 0) {
            pos[i] = G.gridSize - 1;
        } else if (pos[i] === G.gridSize) {
             pos[i] = 0;
        }
    }
    changeSelectionTo(pos);
};

function populateGameBoard(rootDims : Dims) : void {
    const rootNode : HTMLElement = makeDiv(rootDims);
    const childDims : Dims = { width : rootDims.height, height : rootDims.height };
    const locDiv : HTMLElement = makeDiv(childDims);
    const colorDiv : HTMLElement = makeDiv(childDims);
    for (let i : number = 0; i < G.gridSize; ++i) {
        const gridRow : Block[] = [];
        const colorRow : Block[] = [];
        G.locGrid.push(gridRow);
        G.colorGrid.push(colorRow);
        for (let j : number = 0; j < G.gridSize; ++j) {
            const block = new Block(childDims, locDiv, colorDiv, new Coords(i, j));
            gridRow.push(block);
            colorRow.push(block);
        }
    }
    rootNode.appendChild(locDiv);
    rootNode.appendChild(colorDiv);
    document.body.appendChild(rootNode);
    changeSelectionTo(G.selection);
}

function main() : void {
    const tbDim : Dims = { width: G.width, height: G.height / 15};
    const titleBar : HTMLElement = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>Foo</h1>";
    document.body.appendChild(titleBar);
    populateGameBoard({ width: G.width, height: G.height / 2 - tbDim.height});
    // TODO: set up an actual puzzle of a board
}
