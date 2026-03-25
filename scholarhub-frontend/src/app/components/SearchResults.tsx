import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
} from "@mui/material";
import {
  PictureAsPdf,
  VideoLibrary,
  Image as ImageIcon,
  Article,
  Description as FileIcon,
  Folder as FolderIcon,
} from "@mui/icons-material";

export interface SearchResultItem {
  id: string;
  name: string;
  type: "pdf" | "docx" | "pptx" | "video" | "image" | "other";
  size?: string;
  folder?: string;
  description?: string;
  tags?: string[];
}

interface SearchResultsProps {
  results: SearchResultItem[];
  query: string;
  onResultClick?: (result: SearchResultItem) => void;
}

function getFileIcon(type: string) {
  const iconProps = { sx: { fontSize: 40 } };
  switch (type) {
    case "pdf":
      return <PictureAsPdf {...iconProps} sx={{ fontSize: 40, color: "#d32f2f" }} />;
    case "docx":
      return <Article {...iconProps} sx={{ fontSize: 40, color: "#1976d2" }} />;
    case "pptx":
      return <FileIcon {...iconProps} sx={{ fontSize: 40, color: "#ed6c02" }} />;
    case "video":
      return <VideoLibrary {...iconProps} sx={{ fontSize: 40, color: "#9c27b0" }} />;
    case "image":
      return <ImageIcon {...iconProps} sx={{ fontSize: 40, color: "#2e7d32" }} />;
    default:
      return <FileIcon {...iconProps} sx={{ fontSize: 40, color: "#757575" }} />;
  }
}

export function SearchResults({ results, query, onResultClick }: SearchResultsProps) {
  if (!query) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Welcome to Scholar Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Search for files, documents, videos, and study materials
        </Typography>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No results found for "{query}"
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try different keywords or check your spelling
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Tìm kiếm kết quả cho "{query}"
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tìm thấy {results.length} kết quả cho "{query}"
      </Typography>

      <Grid container spacing={2}>
        {results.map((result) => (
          <Grid item xs={12} sm={6} md={4} key={result.id}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                "&:hover": {
                  boxShadow: 2,
                  borderColor: "#1976d2",
                },
              }}
            >
              <CardActionArea onClick={() => onResultClick && onResultClick(result)}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flexShrink: 0 }}>
                      {getFileIcon(result.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {result.name}
                      </Typography>
                      {result.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {result.description}
                        </Typography>
                      )}
                      {result.folder && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                          <FolderIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography variant="caption" color="text.secondary">
                            {result.folder}
                          </Typography>
                        </Box>
                      )}
                      {result.size && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          {result.size}
                        </Typography>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                          {result.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
