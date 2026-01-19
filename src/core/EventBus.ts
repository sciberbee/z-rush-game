import type { GameEvent, GameEventType, EventCallback } from '../types';

class EventBusClass {
  private listeners: Map<GameEventType, Set<EventCallback>> = new Map();

  on(eventType: GameEventType, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: GameEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(eventType: GameEventType, data?: unknown): void {
    const event: GameEvent = { type: eventType, data };
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const EventBus = new EventBusClass();
