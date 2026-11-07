/** An error that is safe to show to the client, with an HTTP status and stable code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new HttpError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Not found') {
    return new HttpError(404, 'NOT_FOUND', message);
  }
}
