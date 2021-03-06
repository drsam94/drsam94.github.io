// Non-confidential and non-proprietary information of Sam Donow

export class Color {
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

    public static white() : Color {
        return new Color(255, 255, 255);
    }

    public static black() : Color {
        return new Color(0.0, 0.0, 0.0);
    }

    public static red() : Color {
        return new Color(255, 0.0, 0.0);
    }

    public static green() : Color {
        return new Color(0.0, 255, 0.0);
    }

    public static blue() : Color {
        return new Color(0.0, 0.0, 255);
    }
}

// TODO: include in a class, as that's apparently the only way to make it readonly (i.e, actually const)
const allColors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
export class Coords {
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
    public toColor(maxScale : number) : Color {
        return allColors[this.row].mul((this.col + 1) / maxScale);
    }
}

export const enum Direction {
    Up = 1,
    Right = 2,
    Down = -1,
    Left = -2
}

export interface Dims {
    width : number;
    height : number;
}
