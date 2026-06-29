export class CancellationException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'CancellationException';
  }
}

export class SubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export class DirectoryLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectoryLoadError';
  }
}

export class ProviderError extends Error {
  constructor(message: string, public readonly address?: string) {
    super(message);
    this.name = 'ProviderError';
  }
}