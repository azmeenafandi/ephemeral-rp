import { describe, it, expect } from 'vitest';
import { AppError, ApiError, AuthError, ValidationError, NetworkError } from '../errors';

describe('AppError', () => {
  it('sets name and message', () => {
    const err = new AppError('test message', 'TEST_CODE');
    expect(err.name).toBe('AppError');
    expect(err.message).toBe('test message');
    expect(err.code).toBe('TEST_CODE');
  });

  it('has optional userMessage', () => {
    const err = new AppError('internal', 'CODE', 'friendly message');
    expect(err.userMessage).toBe('friendly message');
  });

  it('defaults userMessage to undefined', () => {
    const err = new AppError('oops', 'CODE');
    expect(err.userMessage).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const err = new AppError('fail', 'CODE');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ApiError', () => {
  it('has API_ERROR code', () => {
    const err = new ApiError('api failed');
    expect(err.code).toBe('API_ERROR');
    expect(err.name).toBe('ApiError');
  });

  it('is an instance of AppError', () => {
    const err = new ApiError('api failed');
    expect(err).toBeInstanceOf(AppError);
  });

  it('accepts optional userMessage', () => {
    const err = new ApiError('api failed', 'Something went wrong');
    expect(err.userMessage).toBe('Something went wrong');
  });
});

describe('AuthError', () => {
  it('has AUTH_ERROR code and user-friendly message', () => {
    const err = new AuthError('invalid key');
    expect(err.code).toBe('AUTH_ERROR');
    expect(err.userMessage).toContain('check your key');
  });

  it('is an instance of AppError', () => {
    const err = new AuthError('invalid key');
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('uses input message as userMessage', () => {
    const err = new ValidationError('name must be string');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.userMessage).toBe('name must be string');
  });

  it('is an instance of AppError', () => {
    const err = new ValidationError('bad input');
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('NetworkError', () => {
  it('has NETWORK_ERROR code', () => {
    const err = new NetworkError('fetch failed');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.userMessage).toContain('connection');
  });

  it('is an instance of AppError', () => {
    const err = new NetworkError('no internet');
    expect(err).toBeInstanceOf(AppError);
  });
});
