interface HTMLElement {
  listen: <T extends keyof HTMLElementEventMap>(eventType: T, decider?: (this: this, event: HTMLElementEventMap[T]) => boolean) => Promise<HTMLElementEventMap[T]>;
}