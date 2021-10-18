"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(errorCode, message) {
        if (errorCode === void 0) { errorCode = 500; }
        if (message === void 0) { message = ''; }
        var _this = this;
        if (!message) {
            switch (errorCode) {
                case 400:
                    message = 'Bad Request';
                    break;
                case 401:
                    message = 'Authentication Failed';
                    break;
                case 403:
                    message = 'Not Authorized';
                    break;
                case 404:
                    message = 'Not Found';
                    break;
                case 409:
                    message = 'Conflict';
                    break;
                case 422:
                    message = 'Validation Failed';
                    break;
                case 500:
                    message = 'Internal Server Error';
                    break;
                default:
                    break;
            }
        }
        _this = _super.call(this, message) || this;
        _this.code = errorCode;
        return _this;
    }
    return HttpError;
}(Error));
exports.default = HttpError;
