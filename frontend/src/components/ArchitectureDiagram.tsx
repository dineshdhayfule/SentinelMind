import { Box, Paper, Stack, Typography } from "@mui/material";

const layers = [
  {
    title: "AI Agent",
    description: "User-facing assistant or autonomous workflow",
  },
  {
    title: "SentinelMind Intercept Layer",
    description: "Captures prompts, tool calls, and execution context",
  },
  {
    title: "Context Enrichment",
    description: "Adds metadata, history, and behavioral signals",
  },
  {
    title: "AI Threat Analysis",
    description: "Classifies prompt risk and intent drift patterns",
  },
  {
    title: "Decision Engine",
    description: "Determines allow, block, quarantine, or escalate",
  },
  {
    title: "WebSocket Event Stream",
    description: "Broadcasts incidents to connected operators in real time",
  },
  {
    title: "SOC Dashboard",
    description: "Visualizes incidents, timeline, and response status",
  },
];

export default function ArchitectureDiagram() {
  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        AI Security Architecture
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        A simple operator view of how SentinelMind intercepts and analyzes AI-agent activity.
      </Typography>

      <Stack spacing={1.25}>
        {layers.map((layer, index) => (
          <Box key={layer.title}>
            <Paper
              elevation={0}
              sx={{
                px: 2.5,
                py: 2,
                borderRadius: 2,
                background: index === 0 ? "linear-gradient(135deg, rgba(33,150,243,0.24), rgba(33,150,243,0.08))" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {layer.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {layer.description}
              </Typography>
            </Paper>
            {index < layers.length - 1 && (
              <Typography align="center" sx={{ py: 0.75, color: "rgba(255,255,255,0.55)", fontSize: 24 }}>
                ↓
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}