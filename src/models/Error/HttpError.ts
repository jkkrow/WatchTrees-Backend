export default class HttpError extends Error {
  code: number;

  constructor(errorCode = 500, message = '') {
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
    super(message);
    this.code = errorCode;
  }
}
