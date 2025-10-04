import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Polyglot OCR Proxy worker', () => {
	it('responds with health check (unit style)', async () => {
		const request = new IncomingRequest('http://example.com/');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		const responseText = await response.text();
		const responseJson = JSON.parse(responseText);
		expect(responseJson.status).toBe('ok');
		expect(responseJson.message).toBe('Polyglot OCR Proxy running');
	});

	it('responds with health check (integration style)', async () => {
		const response = await SELF.fetch('https://example.com/');
		const responseText = await response.text();
		const responseJson = JSON.parse(responseText);
		expect(responseJson.status).toBe('ok');
		expect(responseJson.message).toBe('Polyglot OCR Proxy running');
	});

	it('returns test endpoint with standardized response format', async () => {
		const request = new IncomingRequest('http://example.com/test');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const responseText = await response.text();
		const responseJson = JSON.parse(responseText);
		
		expect(responseJson.success).toBe(true);
		expect(responseJson.transcript).toBe('Test transcript from proxy');
		expect(responseJson.error).toBe(null);
		expect(response.status).toBe(200);
	});

	it('returns configuration error when no API key is set', async () => {
		const envWithoutApiKey = { ...env, DEEPGRAM_API_KEY: undefined };
		const request = new IncomingRequest('http://example.com/stt', {
			method: 'POST',
			body: new ArrayBuffer(0),
			headers: { 'Content-Type': 'audio/wav' }
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, envWithoutApiKey, ctx);
		await waitOnExecutionContext(ctx);
		const responseText = await response.text();
		const responseJson = JSON.parse(responseText);
		
		expect(responseJson.success).toBe(false);
		expect(responseJson.transcript).toBe(null);
		expect(responseJson.error).toContain('DEEPGRAM_API_KEY not configured');
		expect(response.status).toBe(500);
	});

	it('returns error for empty audio data', async () => {
		const request = new IncomingRequest('http://example.com/stt', {
			method: 'POST',
			body: new ArrayBuffer(0),
			headers: { 'Content-Type': 'audio/wav' }
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const responseText = await response.text();
		const responseJson = JSON.parse(responseText);
		
		expect(responseJson.success).toBe(false);
		expect(responseJson.transcript).toBe(null);
		expect(responseJson.error).toBe('Invalid audio data: empty or null');
		expect(response.status).toBe(400);
	});
});
