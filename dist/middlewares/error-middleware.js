"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errorHandler = function (error, req, res, next) {
    console.log(error);
    if (res.headersSent) {
        return next(error);
    }
    res
        .status(error.code || 500)
        .json({ message: error.message || 'An unknown error occurred!' });
};
exports.default = errorHandler;
