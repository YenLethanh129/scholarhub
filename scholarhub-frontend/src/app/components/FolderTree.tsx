import { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ExpandMore,
  ChevronRight,
  Description as FileIcon,
  PictureAsPdf,
  VideoLibrary,
  Image,
  Article,
} from "@mui/icons-material";

export interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "docx" | "pptx" | "video" | "image" | "other";
  size?: string;
  modifiedDate?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  children?: FolderItem[];
  files?: FileItem[];
}

interface FolderTreeProps {
  folders: FolderItem[];
  onFileClick?: (file: FileItem) => void;
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <PictureAsPdf sx={{ color: "#d32f2f" }} />;
    case "docx":
      return <Article sx={{ color: "#1976d2" }} />;
    case "pptx":
      return <FileIcon sx={{ color: "#ed6c02" }} />;
    case "video":
      return <VideoLibrary sx={{ color: "#9c27b0" }} />;
    case "image":
      return <Image sx={{ color: "#2e7d32" }} />;
    default:
      return <FileIcon sx={{ color: "#757575" }} />;
  }
}

function FolderTreeNode({
  folder,
  level = 0,
  onFileClick,
}: {
  folder: FolderItem;
  level?: number;
  onFileClick?: (file: FileItem) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };

  const hasChildren = folder.children && folder.children.length > 0;
  const hasFiles = folder.files && folder.files.length > 0;

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleToggle} sx={{ pl: 2 + level * 2 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {hasChildren || hasFiles ? (
              open ? (
                <ExpandMore />
              ) : (
                <ChevronRight />
              )
            ) : null}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {open ? <FolderOpenIcon sx={{ color: "#f9a825" }} /> : <FolderIcon sx={{ color: "#fbc02d" }} />}
          </ListItemIcon>
          <ListItemText
            primary={folder.name}
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>
      </ListItem>

      <Collapse in={open} timeout="auto" unmountOnExit>
        {/* Render child folders */}
        {hasChildren && (
          <List disablePadding>
            {folder.children!.map((child) => (
              <FolderTreeNode
                key={child.id}
                folder={child}
                level={level + 1}
                onFileClick={onFileClick}
              />
            ))}
          </List>
        )}

        {/* Render files */}
        {hasFiles && (
          <List disablePadding>
            {folder.files!.map((file) => (
              <ListItem key={file.id} disablePadding>
                <ListItemButton
                  sx={{ pl: 2 + (level + 1) * 2 }}
                  onClick={() => onFileClick && onFileClick(file)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }} />
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getFileIcon(file.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={file.size}
                    primaryTypographyProps={{ fontSize: 13 }}
                    secondaryTypographyProps={{ fontSize: 11 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Collapse>
    </>
  );
}

export function FolderTree({ folders, onFileClick }: FolderTreeProps) {
  return (
    <Box sx={{ width: "100%", bgcolor: "background.paper" }}>
      <Typography
        variant="subtitle2"
        sx={{ p: 2, pb: 1, fontWeight: 600, color: "text.secondary" }}
      >
        Folder Management
      </Typography>
      <List disablePadding>
        {folders.map((folder) => (
          <FolderTreeNode key={folder.id} folder={folder} onFileClick={onFileClick} />
        ))}
      </List>
    </Box>
  );
}
