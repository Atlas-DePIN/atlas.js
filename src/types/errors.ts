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