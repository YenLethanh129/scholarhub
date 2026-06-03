import type { FolderItem, FileItem } from "../models/Folder";

export interface FolderContent {
  folders: FolderItem[];
  files: FileItem[];
}

export interface IFolderService {
  getTree(): Promise<FolderItem[]>;
  getContents(folderId: string): Promise<FolderContent>;
  create(name: string, parentFolderId?: string | null): Promise<void>;
  rename(folderId: string, newName: string): Promise<void>;
  move(folderId: string, parentFolderId: string): Promise<void>;
  delete(folderId: string): Promise<void>;
}
