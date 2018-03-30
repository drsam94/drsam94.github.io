document.body.onload = main;

var G =  {
    width: window.innerWidth,
    height: window.innerHeight,
    selectedNode: null,
    lastSelectedNode: null
};

function Block() {
    var block = document.createElement("div");
    block.style.float = "left";
    block.style.width = G.width / 3;
    block.style.height = G.height / 3;

    this.node = block;
    this.node.onclick = () => { this.setSelected() };
    this.setDefault();
}

Block.prototype.setDefault =  function() {
    this.node.style.border = "1px solid #ccc";
    this.node.style["border-width"] = "1px 1px 1px 1px";
};

Block.prototype.setSelected = function() {
    this.node.style.border = "5px solid #ff0000";
    this.node.style["border-width"] = "1px 1px 1px 1px";
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

function main() {
    var root = document.createElement("div");
    document.body.appendChild(root);
    for (var i = 0; i < 5; ++i) {
        root.appendChild((new Block()).node);
    }
}
