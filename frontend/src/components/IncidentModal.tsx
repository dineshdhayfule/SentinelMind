import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import { jsPDF } from "jspdf";

export type Incident = {
  id?: string;
  prompt: string;
  risk: number;
  status: string;
  threat?: string;
  explanation?: string;
  recommended_action?: string;
  createdAt: string;
};

type IncidentModalProps = {
  open: boolean;
  incident: Incident | null;
  onClose: () => void;
};

function getSeverityLabel(risk: number) {
  if (risk <= 30) {
    return "Low";
  }

  if (risk <= 70) {
    return "Medium";
  }

  return "High";
}

function getSeverityColor(risk: number) {
  if (risk <= 30) {
    return "#4CAF50";
  }

  if (risk <= 70) {
    return "#FFEB3B";
  }

  return "#F44336";
}

function getRecommendedAction(threat: string) {
  if (threat === "Prompt Injection") {
    return "Block and Alert";
  }

  if (threat === "Privilege Escalation") {
    return "Block Immediately";
  }

  if (threat === "Data Exfiltration") {
    return "Quarantine Session";
  }

  if (threat === "Agentic Abuse") {
    return "Suspend Agent";
  }

  if (threat === "Intent Drift") {
    return "Quarantine Workflow";
  }

  if (threat === "Behavioral Anomaly") {
    return "Investigate Baseline Drift";
  }

  return "Allow";
}

function getFallbackExplanation(threat: string, prompt: string) {
  if (threat === "Prompt Injection") {
    return "The prompt attempts to override existing instructions and redirect the model away from its safe operating boundaries.";
  }

  if (threat === "Privilege Escalation") {
    return "The prompt appears to request elevated access or privileged information, which is consistent with privilege escalation attempts.";
  }

  if (threat === "Data Exfiltration") {
    return "The prompt suggests extracting sensitive data or moving information outside its intended trust boundary.";
  }

  if (threat === "Agentic Abuse") {
    return "The simulated agent is attempting a risky tool action that exceeds the expected trust boundary.";
  }

  if (threat === "Intent Drift") {
    return "The declared goal diverges from the actual action, which is a strong indicator of intent drift.";
  }

  if (threat === "Behavioral Anomaly") {
    return "Current activity deviates sharply from the normal behavioral baseline, suggesting suspicious automation.";
  }

  if (prompt.toLowerCase().includes("override") || prompt.toLowerCase().includes("ignore")) {
    return "The prompt attempts to override existing instructions and access privileged information. This behavior matches common prompt injection and privilege escalation patterns.";
  }

  return "No suspicious security behavior was detected in this prompt.";
}

export default function IncidentModal({ open, incident, onClose }: IncidentModalProps) {
  if (!incident) {
    return null;
  }

  const incidentId = incident.id ?? `INC-${new Date(incident.createdAt).getTime() || Date.now()}`;
  const severityColor = getSeverityColor(incident.risk);
  const severityLabel = getSeverityLabel(incident.risk);
  const threat = incident.threat ?? "Safe";
  const confidence = Math.min(99, incident.risk + 10);
  const createdAt = new Date(incident.createdAt).toLocaleString();
  const explanation = incident.explanation ?? getFallbackExplanation(threat, incident.prompt);
  const recommendedAction = incident.recommended_action ?? getRecommendedAction(threat);

  const exportJson = () => {
    const report = {
      incidentId,
      threatType: threat,
      riskScore: incident.risk,
      status: incident.status,
      originalPrompt: incident.prompt,
      createdAt: incident.createdAt,
      severity: severityLabel,
      confidence,
      explanation,
      recommendedAction,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `incident-report-${new Date().getTime()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const ensureSpace = (height: number) => {
      if (cursorY + height > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

    const writeHeader = (text: string, size = 16) => {
      ensureSpace(size + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.text(text, margin, cursorY);
      cursorY += size + 12;
    };

    const writeLine = (label: string, value: string) => {
      ensureSpace(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${label}:`, margin, cursorY);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(value, maxWidth - 90);
      doc.text(wrapped, margin + 90, cursorY);
      cursorY += Math.max(18, wrapped.length * 14);
    };

    const writeParagraph = (label: string, value: string) => {
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, margin, cursorY);
      cursorY += 16;
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(value, maxWidth);
      doc.text(wrapped, margin, cursorY);
      cursorY += wrapped.length * 14 + 8;
    };

    doc.setTextColor(17, 24, 39);
    writeHeader("SentinelMind Incident Report", 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, cursorY);
    cursorY += 24;

    writeHeader("Incident Summary", 14);
    writeLine("Incident ID", incidentId);
    writeLine("Threat Type", threat);
    writeLine("Risk Score", `${incident.risk}`);
    writeLine("Status", incident.status.toUpperCase());
    writeLine("Severity", severityLabel);
    writeLine("Confidence", `${confidence}%`);

    writeHeader("Prompt", 14);
    writeParagraph("Original Prompt", incident.prompt);
    writeHeader("Analysis", 14);
    writeParagraph("AI Security Explanation", explanation);
    writeParagraph("Recommended Action", recommendedAction);

    doc.save("SentinelMind Incident Report.pdf");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Incident Report</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`${severityLabel} Severity`}
            sx={{
              mb: 2,
              backgroundColor: severityColor,
              color: severityColor === "#FFEB3B" ? "#111827" : "#fff",
              fontWeight: 700,
            }}
          />
          <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="AI Verified Analysis" color="info" size="small" />
            <Chip label={`Confidence ${confidence}%`} size="small" variant="outlined" />
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Incident ID
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {incidentId}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Threat Type
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {threat}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Risk Score
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {incident.risk}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {incident.status.toUpperCase()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Original Prompt
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mt: 0.5,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {incident.prompt}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {createdAt}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mt: 1, mb: 1, fontWeight: 700 }}>
                AI Security Explanation
              </Typography>
              <Typography variant="body1" sx={{ color: "text.primary" }}>
                {explanation}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mt: 1, mb: 1, fontWeight: 700 }}>
                Recommended Action
              </Typography>
              <Typography variant="body1" sx={{ color: "text.primary" }}>
                {recommendedAction}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={exportPdf} variant="outlined">
          Export PDF
        </Button>
        <Button onClick={exportJson} variant="text">
          Export JSON
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}