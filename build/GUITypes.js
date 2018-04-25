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
export { Color };
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
export { Coords };
