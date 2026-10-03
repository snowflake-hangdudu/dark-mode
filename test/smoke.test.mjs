import test from 'node:test';
import assert from 'node:assert/strict';
import { ErrorCode, createAppError, toErrorPayload } from '../src/shared/errors.js';

test('错误可以转换为可传输对象', () => {
  const payload = toErrorPayload(createAppError(ErrorCode.INVALID_INPUT, '参数错误'));
  assert.deepEqual(payload, { code: 'INVALID_INPUT', message: '参数错误' });
});

test('错误可携带可选诊断字段', () => {
  const payload = toErrorPayload(createAppError(ErrorCode.INVALID_INPUT, '参数错误', {
    details: { field: 'url' }, retryable: false, httpStatus: 400
  }));
  assert.deepEqual(payload, {
    code: 'INVALID_INPUT', message: '参数错误', details: { field: 'url' }, retryable: false, httpStatus: 400
  });
});
