"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinMaxDuration = exports.getFullSize = exports.getAllPaths = exports.validateNodes = exports.traverseNodes = exports.findByChildId = exports.findById = void 0;
var findById = function (tree, id) {
    var currentNode = tree.root;
    var queue = [];
    queue.push(currentNode);
    while (queue.length) {
        currentNode = queue.shift();
        if (currentNode.id === id)
            return currentNode;
        if (currentNode.children.length)
            currentNode.children.forEach(function (child) { return queue.push(child); });
    }
    return null;
};
exports.findById = findById;
var findByChildId = function (tree, id) {
    var currentNode = tree.root;
    var queue = [];
    queue.push(currentNode);
    while (queue.length) {
        currentNode = queue.shift();
        if (currentNode.children.find(function (item) { return (item === null || item === void 0 ? void 0 : item.id) === id; }))
            return currentNode;
        if (currentNode.children.length)
            currentNode.children.forEach(function (child) { return queue.push(child); });
    }
    return null;
};
exports.findByChildId = findByChildId;
var traverseNodes = function (root) {
    var currentNode = root;
    var queue = [];
    var nodes = [];
    queue.push(currentNode);
    while (queue.length) {
        currentNode = queue.shift();
        nodes.push(currentNode);
        if (currentNode.children.length)
            currentNode.children.forEach(function (child) { return queue.push(child); });
    }
    return nodes;
};
exports.traverseNodes = traverseNodes;
var validateNodes = function (root, key, value, type) {
    if (type === void 0) { type = true; }
    var nodes = (0, exports.traverseNodes)(root);
    if (key === 'info') {
        return !!nodes.find(function (node) {
            return type ? node.info === (value || null) : node.info !== (value || null);
        });
    }
    return !!nodes.find(function (node) { var _a, _b; return type ? ((_a = node.info) === null || _a === void 0 ? void 0 : _a[key]) === value : ((_b = node.info) === null || _b === void 0 ? void 0 : _b[key]) !== value; });
};
exports.validateNodes = validateNodes;
var getAllPaths = function (tree) {
    var result = [];
    var iterate = function (currentNode, path) {
        var newPath = path.concat(currentNode);
        if (currentNode.children.length) {
            return currentNode.children.forEach(function (child) {
                iterate(child, newPath);
            });
        }
        result.push(newPath);
    };
    iterate(tree.root, []);
    return result;
};
exports.getAllPaths = getAllPaths;
var getFullSize = function (tree) {
    var nodes = (0, exports.traverseNodes)(tree.root);
    return nodes.reduce(function (acc, cur) { var _a, _b; return acc + ((_b = (_a = cur.info) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0); }, 0);
};
exports.getFullSize = getFullSize;
var getMinMaxDuration = function (tree) {
    var paths = (0, exports.getAllPaths)(tree);
    var possibleDurations = paths.map(function (path) {
        return path.reduce(function (acc, cur) { var _a, _b; return acc + ((_b = (_a = cur.info) === null || _a === void 0 ? void 0 : _a.duration) !== null && _b !== void 0 ? _b : 0); }, 0);
    });
    return {
        max: Math.max.apply(Math, possibleDurations),
        min: Math.min.apply(Math, possibleDurations),
    };
};
exports.getMinMaxDuration = getMinMaxDuration;
