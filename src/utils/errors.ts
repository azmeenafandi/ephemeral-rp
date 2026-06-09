export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ApiError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'API_ERROR', userMessage);
    this.name = 'ApiError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 'API key rejected — please check your key in Settings.');
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 'Network error. Please check your connection and try again.');
    this.name = 'NetworkError';
  }
}
