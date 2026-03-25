import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  History as HistoryIcon,
  PictureAsPdf,
  VideoLibrary,
  Image,
  Article,
  Description as FileIcon,
} from "@mui/icons-material";

export interface HistoryItem {
  id: string;
  name: string;
  type: "pdf" | "docx" | "pptx" | "video" | "image" | "other";
  viewedAt: string;
  folder?: string;
}

interface ViewingHistoryProps {
  history: HistoryItem[];
  onItemClick?: (item: HistoryItem) => void;
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <PictureAsPdf sx={{ color: "#d32f2f", fontSize: 20 }} />;
    case "docx":
      return <Article sx={{ color: "#1976d2", fontSize: 20 }} />;
    case "pptx":
      return <FileIcon sx={{ color: "#ed6c02", fontSize: 20 }} />;
    case "video":
      return <VideoLibrary sx={{ color: "#9c27b0", fontSize: 20 }} />;
    case "image":
      return <Image sx={{ color: "#2e7d32", fontSize: 20 }} />;
    default:
      return <FileIcon sx={{ color: "#757575", fontSize: 20 }} />;
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export function ViewingHistory({ history, onItemClick }: ViewingHistoryProps) {
  return (
    <Box sx={{ width: "100%", bgcolor: "background.paper", mt: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{ p: 2, pb: 1, fontWeight: 600, color: "text.secondary" }}
      >
        Viewing History
      </Typography>
      {history.length === 0 ? (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <HistoryIcon sx={{ color: "text.disabled", fontSize: 48, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No viewing history yet
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {history.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton onClick={() => onItemClick && onItemClick(item)}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getFileIcon(item.type)}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={formatTimeAgo(item.viewedAt)}
                  primaryTypographyProps={{ fontSize: 13 }}
                  secondaryTypographyProps={{ fontSize: 11 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
