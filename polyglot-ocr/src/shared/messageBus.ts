import { Message, MessageType } from '../types';

export class MessageBus {
  private static instance: MessageBus;
  private listeners: Map<string, Set<(message: Message) => void>> = new Map();

  private constructor() {}

  static getInstance(): MessageBus {
    if (!MessageBus.instance) {
      MessageBus.instance = new MessageBus();
    }
    return MessageBus.instance;
  }

  // Send message to background script
  sendToBackground(type: MessageType, payload?: any): void {
    chrome.runtime.sendMessage({ type, payload });
  }

  // Send message to content script
  sendToContent(tabId: number, type: MessageType, payload?: any): void {
    chrome.tabs.sendMessage(tabId, { type, payload });
  }

  // Send message to offscreen document
  sendToOffscreen(type: MessageType, payload?: any): void {
    // Send message to background script, which will forward to offscreen
    chrome.runtime.sendMessage({ type, payload, target: 'offscreen' });
  }

  // Listen for messages
  onMessage(type: MessageType, callback: (message: Message) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  // Remove message listener
  offMessage(type: MessageType, callback: (message: Message) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Handle incoming messages
  handleMessage(message: Message): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => callback(message));
    }
  }

  // Setup message listener
  setupListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      this.handleMessage(message);
      return true; // Keep message channel open for async responses
    });
  }
}
