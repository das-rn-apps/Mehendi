class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[]; // For validation errors or multiple errors

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // To distinguish between operational and programming errors
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
