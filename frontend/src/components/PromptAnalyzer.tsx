import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Chip,
  Alert,
} from "@mui/material";

type AnalysisResult = {
  id?: string;
  prompt: string;
  risk: number;
  status: string;
  threat: string;
  explanation: string;
  recommended_action: string;
  createdAt: string;
};

type PromptAnalyzerProps = {
  onAnalyzed: (result: AnalysisResult) => void;
};

export default function PromptAnalyzer({ onAnalyzed }: PromptAnalyzerProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to analyze.");
      return;
    }

    const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post<AnalysisResult>(`${API_BASE}/analyze`, {
        prompt,
      });

      setResult(response.data);
      onAnalyzed(response.data);
    } catch (err) {
      setError("Unable to analyze prompt. Confirm backend is reachable from this site.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        backgroundColor: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Prompt Analyzer
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={3}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Enter prompt"
        sx={{ mb: 2 }}
      />

      <Button variant="contained" onClick={analyzePrompt} disabled={isLoading}>
        {isLoading ? "Analyzing..." : "Analyze"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ mb: 1 }}>
            Threat Type: <strong>{result.threat}</strong>
          </Typography>
          <Typography sx={{ mb: 1 }}>Risk Score: {result.risk}</Typography>
          <Chip
            label={result.status.toUpperCase()}
            color={result.status === "blocked" ? "error" : "success"}
            size="small"
          />
        </Box>
      )}
    </Paper>
  );
}
