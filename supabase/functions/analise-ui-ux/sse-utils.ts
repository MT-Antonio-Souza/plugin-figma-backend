// Server-Sent Events Utilities

import type { SSEMessage, ErrorResponse } from './types.ts';

export interface SSEWriter {
  response: Response;
  writer: WritableStreamDefaultWriter;
}

export function createSSEResponse(): SSEWriter {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
  
  return { response, writer };
}

export async function sendSSEMessage(
  writer: WritableStreamDefaultWriter, 
  type: string, 
  data: any
): Promise<void> {
  const encoder = new TextEncoder();
  const message: SSEMessage = { type, data };
  const sseData = `data: ${JSON.stringify(message)}\n\n`;
  await writer.write(encoder.encode(sseData));
}

export async function sendErrorResponse(
  writer: WritableStreamDefaultWriter, 
  error: ErrorResponse
): Promise<void> {
  await sendSSEMessage(writer, 'error', error);
  await closeWriter(writer);
}

export async function sendProgressUpdate(
  writer: WritableStreamDefaultWriter,
  step: string,
  message: string
): Promise<void> {
  await sendSSEMessage(writer, 'progress', { step, message });
}

export async function sendResult(
  writer: WritableStreamDefaultWriter,
  result: any
): Promise<void> {
  await sendSSEMessage(writer, 'result', result);
}

export async function closeWriter(writer: WritableStreamDefaultWriter): Promise<void> {
  try {
    await writer.close();
  } catch (error) {
    console.error('Error closing SSE writer:', error);
  }
}