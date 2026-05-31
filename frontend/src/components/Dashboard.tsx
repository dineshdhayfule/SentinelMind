import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Alert,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import SecurityIcon from "@mui/icons-material/Security";
import WarningIcon from "@mui/icons-material/Warning";
import BlockIcon from "@mui/icons-material/Block";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PromptAnalyzer from "./PromptAnalyzer";
import SecurityDemoLab from "./SecurityDemoLab";
import ArchitectureDiagram from "./ArchitectureDiagram";
import IncidentModal, { type Incident } from "./IncidentModal";
import { connectToEventStream } from "../services/socket";

const threatColors: Record<string, string> = {
  Safe: "#4CAF50",
  "Prompt Injection": "#FF9800",
  "Privilege Escalation": "#F44336",
  "Data Exfiltration": "#9C27B0",
  "Agentic Abuse": "#7C4DFF",
  "Intent Drift": "#00ACC1",
  "Behavioral Anomaly": "#E91E63",
};

const riskColors = ["#4CAF50", "#FF9800", "#F44336"];

function formatActivityTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getActivityLabel(event: Incident) {
  if (event.threat === "Safe") {
    return "Safe Request Allowed";
  }

  if (event.threat === "Data Exfiltration") {
    return "Data Exfiltration Attempt Detected";
  }

  if (event.threat === "Agentic Abuse") {
    return "Agentic Abuse Detected";
  }

  if (event.threat === "Intent Drift") {
    return "Intent Drift Detected";
  }

  if (event.threat === "Behavioral Anomaly") {
    return "Behavioral Anomaly Detected";
  }

  return `${event.threat ?? "Threat"} Blocked`;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Paper
    sx={{
      p: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    }}
  >
    <Box>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
        {value}
      </Typography>
    </Box>
    <Icon sx={{ fontSize: 40, color }} />
  </Paper>
);

export default function Dashboard() {
  const [eventData, setEventData] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [recentActivities, setRecentActivities] = useState<string[]>([]);
  const [criticalSnackbarOpen, setCriticalSnackbarOpen] = useState(false);
  const [criticalSnackbarMessage, setCriticalSnackbarMessage] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await axios.get<Incident[]>("http://localhost:8000/events");
        const events = response.data;
        setEventData(events);
        setRecentActivities(events.slice(0, 10).map((event) => `[${formatActivityTime(event.createdAt)}] ${getActivityLabel(event)}`));
      } catch {
        setEventData([]);
      }
    };

    void loadEvents();
  }, []);

  useEffect(() => {
    const disconnect = connectToEventStream((incident) => {
      setLiveConnected(true);
      setEventData((previous) => {
        const next = [incident, ...previous.filter((event) => event.id !== incident.id)];
        const sorted = next.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
        return sorted;
      });

      setRecentActivities((previous) => {
        const updated = [`[${formatActivityTime(incident.createdAt)}] ${getActivityLabel(incident)}`, ...previous];
        return updated.slice(0, 10);
      });

      if (incident.risk >= 71) {
        setCriticalSnackbarMessage(`Critical Threat Detected: ${incident.threat}`);
        setCriticalSnackbarOpen(true);
      }
    });

    return () => {
      disconnect();
    };
  }, []);

  const threatStats = useMemo(() => {
    const total = eventData.length;
    const blocked = eventData.filter((event) => event.status === "blocked").length;
    const avgRisk =
      total > 0
        ? (eventData.reduce((sum, event) => sum + event.risk, 0) / total).toFixed(1)
        : "0.0";

    return {
      total,
      blocked,
      detected: eventData.filter((event) => event.risk >= 40).length,
      avgRisk,
      critical: eventData.filter((event) => event.risk >= 71).length,
      blockRate: total > 0 ? Math.round((blocked / total) * 100) : 0,
    };
  }, [eventData]);

  const threatDistribution = useMemo(() => {
    const buckets = [
      "Safe",
      "Prompt Injection",
      "Privilege Escalation",
      "Data Exfiltration",
      "Agentic Abuse",
      "Intent Drift",
      "Behavioral Anomaly",
    ].map((threat) => ({
      name: threat,
      value: eventData.filter((event) => (event.threat ?? "Safe") === threat).length,
    }));

    return buckets;
  }, [eventData]);

  const riskDistribution = useMemo(() => {
    const low = eventData.filter((event) => event.risk <= 30).length;
    const medium = eventData.filter((event) => event.risk >= 31 && event.risk <= 70).length;
    const critical = eventData.filter((event) => event.risk >= 71).length;

    return [
      { name: "Low", value: low },
      { name: "Medium", value: medium },
      { name: "Critical", value: critical },
    ];
  }, [eventData]);

  const threatTimeline = useMemo(
    () =>
      eventData.slice(0, 6).map((event) => ({
        id: event.id ?? `${event.createdAt}-${event.prompt}`,
        time: new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        label: `${event.threat ?? "Safe"} ${event.status === "blocked" ? "Blocked" : "Observed"}`,
        detail: event.prompt,
      })),
    [eventData],
  );

  const handleAnalyzed = (result: Incident) => {
    setEventData((previous) => {
      const next = [result, ...previous.filter((event) => event.id !== result.id)];
      return next.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    });
  };

  const overview = (
    <>
      <PromptAnalyzer onAnalyzed={handleAnalyzed} />

      <IncidentModal
        open={selectedIncident !== null}
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Requests" value={threatStats.total} icon={SecurityIcon} color="#4CAF50" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Threats Detected" value={threatStats.detected} icon={WarningIcon} color="#FF9800" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Blocked Requests" value={threatStats.blocked} icon={BlockIcon} color="#F44336" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Risk Score" value={`${threatStats.avgRisk}/100`} icon={TrendingUpIcon} color="#2196F3" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Threat Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={threatDistribution} dataKey="value" nameKey="name" outerRadius={110} label>
                  {threatDistribution.map((entry) => (
                    <Cell key={entry.name} fill={threatColors[entry.name] ?? "#90A4AE"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Risk Level Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {riskDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={riskColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: "100%", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              SOC Summary
            </Typography>
            <Stack spacing={1.5}>
              <Typography>Total Incidents: {threatStats.total}</Typography>
              <Typography>Critical Incidents: {threatStats.critical}</Typography>
              <Typography>Block Rate: {threatStats.blockRate}%</Typography>
              <Typography>Average Risk Score: {threatStats.avgRisk}</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: "100%", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Recent Activity Feed
            </Typography>
            <Stack spacing={1} sx={{ maxHeight: 260, overflowY: "auto" }}>
              {recentActivities.length === 0 ? (
                <Typography color="text.secondary">No activity yet.</Typography>
              ) : (
                recentActivities.map((activity) => (
                  <Typography key={activity} variant="body2" sx={{ fontFamily: "monospace" }}>
                    {activity}
                  </Typography>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: "100%", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Live Monitoring
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#4CAF50" }} />
              <Typography>Streaming incident updates in real time</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 4, backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Threat Timeline
        </Typography>
        <Stack spacing={1.5}>
          {threatTimeline.length === 0 ? (
            <Typography color="text.secondary">No timeline entries yet.</Typography>
          ) : (
            threatTimeline.map((item) => (
              <Box key={item.id} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Typography sx={{ minWidth: 56, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>
                  {item.time}
                </Typography>
                <Box sx={{ width: 10, height: 10, mt: 0.8, borderRadius: "50%", backgroundColor: "#FF9800", flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{item.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.detail}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="h6" sx={{ p: 2, fontWeight: "bold" }}>
          Recent Security Events
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>Prompt</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>Risk</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>Threat</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>Status</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventData.map((event) => (
                <TableRow
                  key={event.id}
                  hover
                  onClick={() => setSelectedIncident(event)}
                  sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                >
                  <TableCell sx={{ color: "rgba(255,255,255,0.9)" }}>{event.prompt}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.9)" }}>
                    <Box
                      sx={{
                        display: "inline-block",
                        backgroundColor: event.risk > 80 ? "rgba(244, 67, 54, 0.2)" : "rgba(255, 152, 0, 0.2)",
                        color: event.risk > 80 ? "#F44336" : "#FF9800",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {event.risk}%
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.9)" }}>{event.threat ?? "Safe"}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.9)" }}>
                    <Chip label={event.status} color={event.status === "blocked" ? "error" : "success"} size="small" />
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.9)" }}>{new Date(event.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );

  const architecture = (
    <>
      <ArchitectureDiagram />
      <Paper sx={{ mt: 3, p: 3, backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
          Why Judges Read This Fast
        </Typography>
        <Typography color="text.secondary">
          The flow is easy to explain in one sentence: an AI agent is intercepted, enriched, analyzed, scored, and broadcast to the SOC dashboard in real time.
        </Typography>
      </Paper>
    </>
  );

  const demo = <SecurityDemoLab onIncidentCreated={handleAnalyzed} />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          SentinelMind Dashboard
        </Typography>
        <Chip
          label={liveConnected ? "LIVE" : "CONNECTING"}
          color={liveConnected ? "success" : "warning"}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <PromptAnalyzer onAnalyzed={handleAnalyzed} />

      <SecurityDemoLab onIncidentCreated={handleAnalyzed} />

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ mb: 3, borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          <Tab label="Overview" />
          <Tab label="Architecture" />
          <Tab label="Demo Script" />
        </Tabs>

        {activeTab === 0 && overview}
        {activeTab === 1 && architecture}
        {activeTab === 2 && demo}

        <IncidentModal
          open={selectedIncident !== null}
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />

        <Snackbar
          open={criticalSnackbarOpen}
          autoHideDuration={5000}
          onClose={() => setCriticalSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={() => setCriticalSnackbarOpen(false)} severity="error" variant="filled" sx={{ width: "100%" }}>
            {criticalSnackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    );
  }
