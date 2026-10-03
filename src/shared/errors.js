export const ErrorCode = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_SUPPORTED: 'NOT_SUPPORTED'
});

export function createAppError(code, message, options = undefined) {
  const error = new Error(message || '发生未知错误');
  error.code = code || ErrorCode.UNKNOWN;
  if (options !== undefined) {
    const metadata = options && typeof options === 'object' && !Array.isArray(options)
      ? options
      : { details: options };
    if (metadata.details !== undefined) error.details = metadata.details;
    if (metadata.retryable !== undefined) error.retryable = Boolean(metadata.retryable);
    if (metadata.httpStatus !== undefined) error.httpStatus = metadata.httpStatus;
  }
  return error;
}

export function toErrorPayload(error) {
  const payload = {
    code: error?.code || ErrorCode.UNKNOWN,
    message: error?.message || '发生未知错误'
  };
  if (error?.details !== undefined) payload.details = error.details;
  if (error?.retryable !== undefined) payload.retryable = Boolean(error.retryable);
  if (error?.httpStatus !== undefined) payload.httpStatus = error.httpStatus;
  return payload;
}
