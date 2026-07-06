import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle,
  Truck,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Dynamically determine the API Base URL based on where the browser is running.
// If local, point to port 3000. If deployed on Vercel, use relative paths.
const API_BASE = import.meta.env.VITE_API_URL || 
  ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : '');

// Custom MetaYB logo matching the user's provided wordmark
const MetaYBLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', userSelect: 'none' }}>
    <svg width="28" height="28" viewBox="0 0 60 60" fill="none" style={{ display: 'block' }}>
      <path 
        d="M 12 48 V 28 A 8 8 0 0 1 28 28 V 48 M 28 48 V 28 A 8 8 0 0 1 44 28 V 48" 
        stroke="#3b82f6" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
    <span style={{ 
      fontFamily: '"Comfortaa", cursive, sans-serif', 
      fontSize: '1.65rem', 
      fontWeight: '700', 
      color: '#3b82f6', 
      letterSpacing: '-0.06em',
      marginLeft: '-3px',
      transform: 'translateY(-1px)',
      display: 'inline-block'
    }}>etayb</span>
  </div>
);

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    critical: 0,
    safe: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/dashboard/submissions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          console.error("Expected array but got:", data);
          setSubmissions([]);
        }
      })
      .catch(err => {
        console.error("Error loading submissions:", err);
        setSubmissions([]);
      });
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/api/v1/dashboard/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      setIsConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_submission') {
          setSubmissions(prev => {
            const currentSubmissions = Array.isArray(prev) ? prev : [];
            return [data.payload, ...currentSubmissions];
          });
        }
      } catch (err) {
        console.error("Error parsing SSE event:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Recalculate stats whenever submissions change
  useEffect(() => {
    const currentSubmissions = Array.isArray(submissions) ? submissions : [];
    if (currentSubmissions.length === 0) {
      setStats({ total: 0, average: 0, critical: 0, safe: 0 });
      return;
    }

    const total = currentSubmissions.length;
    const sum = currentSubmissions.reduce((acc, curr) => acc + curr.averageMoisture, 0);
    const average = (sum / total).toFixed(1);
    const critical = currentSubmissions.filter(s => s.averageMoisture >= 18).length;
    const safe = currentSubmissions.filter(s => s.averageMoisture < 14).length;

    setStats({
      total,
      average,
      critical,
      safe
    });
  }, [submissions]);

  // Format chart data (reverse to chronological order for line/area chart)
  const currentSubmissions = Array.isArray(submissions) ? submissions : [];
  const chartData = [...currentSubmissions]
    .slice(0, 15)
    .reverse()
    .map(s => ({
      time: s.submittedAt ? s.submittedAt.split(', ')[1]?.substring(0, 5) || 'N/A' : 'N/A',
      moisture: s.averageMoisture,
      vehicle: s.vehicleNo
    }));

  const getMoistureStatus = (val) => {
    if (val >= 18) return { label: 'CRITICAL', class: 'high', desc: 'Too Wet (>18%)' };
    if (val >= 14) return { label: 'WARNING', class: 'mod', desc: 'Moist (14%-18%)' };
    return { label: 'SAFE', class: 'low', desc: 'Dry (<14%)' };
  };

  return (
    <div>
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="logo-container">
            <MetaYBLogo />
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>MoistureCollector Panel</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IIoT Live Monitoring</div>
          </div>
          <span className="team-badge" style={{ marginLeft: '0.5rem' }}>IIoT Team</span>
        </div>
        
        <div className="status-section">
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
            <span>{isConnected ? 'Live Sync Active' : 'Offline / Reconnecting'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        
        {/* Metrics Grid */}
        <section className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon-wrapper">
              <Database size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Shipments</span>
              <span className="metric-value">{stats.total}</span>
            </div>
          </div>

          <div className="metric-card success">
            <div className="metric-icon-wrapper">
              <TrendingUp size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Average Moisture</span>
              <span className="metric-value">{stats.average}%</span>
            </div>
          </div>

          <div className="metric-card danger">
            <div className="metric-icon-wrapper">
              <ShieldAlert size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Critical High (Wet)</span>
              <span className="metric-value">{stats.critical}</span>
            </div>
          </div>

          <div className="metric-card warning">
            <div className="metric-icon-wrapper">
              <CheckCircle size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Safe & Dry (Ideal)</span>
              <span className="metric-value">{stats.safe}</span>
            </div>
          </div>
        </section>

        {/* Visual Panels Grid */}
        <section className="visuals-grid">
          {/* Main Area Chart */}
          <div className="visual-panel">
            <div className="panel-header">
              <span className="panel-title">Moisture Trend (Last 15 readings)</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={16} /> Real-time tracking
              </span>
            </div>
            <div className="chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[8, 25]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: 'var(--border)', 
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                    />
                    <Area type="monotone" dataKey="moisture" stroke="var(--accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMoisture)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <Layers size={40} />
                  <p>No historical reading data to plot trend.</p>
                </div>
              )}
            </div>
          </div>

          {/* Value Distribution */}
          <div className="visual-panel">
            <div className="panel-header">
              <span className="panel-title">Distribution</span>
            </div>
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentSubmissions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Safe', count: stats.safe, fill: '#059669' },
                    { name: 'Warning', count: stats.total - stats.safe - stats.critical, fill: '#d97706' },
                    { name: 'Critical', count: stats.critical, fill: '#dc2626' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: 'var(--border)', 
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                      itemStyle={{ color: 'var(--text-main)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      <Cell fill="#059669" />
                      <Cell fill="#d97706" />
                      <Cell fill="#dc2626" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <Layers size={40} />
                  <p>No data</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Submissions Table / Live Feed */}
        <section className="data-table-wrapper">
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="panel-title">Live Submission Log</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Showing up to 100 entries</span>
          </div>

          <div className="table-responsive">
            {currentSubmissions.length > 0 ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Gate Entry No</th>
                    <th>Vehicle Details</th>
                    <th>Product</th>
                    <th>Average Moisture</th>
                    <th>Operator</th>
                    <th>Received Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubmissions.map((sub) => {
                    const status = getMoistureStatus(sub.averageMoisture);
                    return (
                      <tr key={sub.gateEntryNo || sub._id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{sub.gateEntryNo}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={16} color="var(--text-muted)" />
                            <span>{sub.vehicleNo}</span>
                          </div>
                        </td>
                        <td>{sub.productName}</td>
                        <td>
                          <span className={`moisture-badge ${status.class}`}>
                            {sub.averageMoisture}%
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({status.label})</span>
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={14} color="var(--text-muted)" />
                            <span>{sub.operatorName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span>{sub.submittedAt || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Layers size={48} />
                <h3>No Submissions Logged Yet</h3>
                <p style={{ marginTop: '0.5rem', maxWidth: '400px' }}>
                  Awaiting real-time uploads from industrial handsets. Run `node push-vehicle.js` and submit moisture from the APK to see entries update here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 Paddy Moisture Detector System. Engineered by MetaYB IIoT Team.</p>
        </footer>

      </main>
    </div>
  );
}

export default App;
