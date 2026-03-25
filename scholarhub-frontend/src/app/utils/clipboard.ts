/**
 * Clipboard storage for move operations (folders and files)
 * Auto-expires after 5 minutes or when tab closes
 */

export interface ClipboardItem {
  id: string;
  name: string;
  itemType: "folder" | "file"; // Type of item stored: folder or file
  operation: "move" | "copy";
  timestamp: number;
}

const CLIPBOARD_KEY = "scholarhub_clipboard";
const CLIPBOARD_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_KEY = "scholarhub_clipboard_cleanup";

/**
 * Get current clipboard item
 */
export function getClipboardItem(): ClipboardItem | null {
  try {
    const stored = sessionStorage.getItem(CLIPBOARD_KEY);
    if (!stored) return null;

    const item = JSON.parse(stored) as ClipboardItem;
    const now = Date.now();

    // Check if expired
    if (now - item.timestamp > CLIPBOARD_EXPIRY_MS) {
      clearClipboard();
      return null;
    }

    return item;
  } catch {
    return null;
  }
}

/**
 * Copy/Move folder or file to clipboard
 * @param id - Material or folder ID
 * @param name - Display name
 * @param itemType - Whether it's a "folder" or "file"
 * @param operation - "move" or "copy" operation
 */
export function setClipboardItem(
  id: string,
  name: string,
  itemType: "folder" | "file" = "folder",
  operation: "move" | "copy" = "move",
): void {
  const item: ClipboardItem = {
    id,
    name,
    itemType,
    operation,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(CLIPBOARD_KEY, JSON.stringify(item));
  setupAutoCleanup();
}

/**
 * Clear clipboard
 */
export function clearClipboard(): void {
  sessionStorage.removeItem(CLIPBOARD_KEY);
}

/**
 * Setup auto-cleanup on page unload or after expiry
 */
function setupAutoCleanup(): void {
  // Remove existing cleanup listeners
  window.removeEventListener("beforeunload", handleBeforeUnload);

  // Add cleanup on page unload
  window.addEventListener("beforeunload", handleBeforeUnload);

  // Also setup a timer for expiry
  const cleanupId = sessionStorage.getItem(CLEANUP_KEY);
  if (cleanupId) {
    clearTimeout(Number(cleanupId));
  }

  const timerId = window.setTimeout(() => {
    clearClipboard();
    sessionStorage.removeItem(CLEANUP_KEY);
  }, CLIPBOARD_EXPIRY_MS);

  sessionStorage.setItem(CLEANUP_KEY, String(timerId));
}

function handleBeforeUnload(): void {
  clearClipboard();
  sessionStorage.removeItem(CLEANUP_KEY);
}

/**
 * Check if clipboard has valid item
 */
export function hasClipboardItem(): boolean {
  return getClipboardItem() !== null;
}

/**
 * Get clipboard operation
 */
export function getClipboardOperation(): "move" | "copy" | null {
  return getClipboardItem()?.operation ?? null;
}

/**
 * Check if clipboard contains a folder
 */
export function isClipboardFolder(): boolean {
  return getClipboardItem()?.itemType === "folder";
}

/**
 * Check if clipboard contains a file
 */
export function isClipboardFile(): boolean {
  return getClipboardItem()?.itemType === "file";
}
