export class ClipboardItem {
  private static readonly CLIPBOARD_KEY = "scholarhub_clipboard";
  private static readonly EXPIRY_MS = 5 * 60 * 1000;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly itemType: "folder" | "file",
    public readonly operation: "move" | "copy",
    public readonly timestamp: number = Date.now(),
  ) {}

  get isExpired(): boolean {
    return Date.now() - this.timestamp > ClipboardItem.EXPIRY_MS;
  }

  static getItem(): ClipboardItem | null {
    try {
      const stored = sessionStorage.getItem(ClipboardItem.CLIPBOARD_KEY);
      if (!stored) return null;
      const data = JSON.parse(stored);
      const item = new ClipboardItem(data.id, data.name, data.itemType, data.operation, data.timestamp);
      if (item.isExpired) {
        ClipboardItem.clear();
        return null;
      }
      return item;
    } catch {
      return null;
    }
  }

  static set(id: string, name: string, itemType: "folder" | "file", operation: "move" | "copy"): void {
    const item = new ClipboardItem(id, name, itemType, operation);
    sessionStorage.setItem(ClipboardItem.CLIPBOARD_KEY, JSON.stringify(item));
  }

  static clear(): void {
    sessionStorage.removeItem(ClipboardItem.CLIPBOARD_KEY);
  }

  static hasItem(): boolean {
    return ClipboardItem.getItem() !== null;
  }
}
