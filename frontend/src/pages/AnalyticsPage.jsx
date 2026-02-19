import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { AlertTriangle, BarChart3, DollarSign, CheckCircle } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AnalyticsPage() {
    const [tab, setTab] = useState('alerts');
    const [alerts, setAlerts] = useState([]);
    const [mortality, setMortality] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAll() {
            try {
                const [a, m, p] = await Promise.all([
                    api.get('/analytics/alerts').catch(() => []),
                    api.get('/analytics/mortality/analysis').catch(() => []),
                    api.get('/analytics/pricing/overview').catch(() => []),
                ]);
                setAlerts(a); setMortality(m); setPricing(p);
            } catch { }
            setLoading(false);
        }
        loadAll();
    }, []);

    const resolveAlert = async (id) => {
        try { await api.patch(`/analytics/alerts/${id}/status`, { status: 'resolved' }); setAlerts(a => a.filter(x => x.alert_id !== id)); }
        catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const mortalityChart = {
        labels: mortality.map(m => m.species || m.common_name || 'Unknown'),
        datasets: [{
            label: 'Mortality Rate (%)',
            data: mortality.map(m => parseFloat(m.mortality_rate || m.avg_mortality_rate || 0)),
            backgroundColor: '#c44a3f',
            borderRadius: 6,
            borderSkipped: false,
        }]
    };

    return (
        <div>
            <div className="page-header">
                <h1>Analytics & Intelligence</h1>
                <p>Alerts, mortality analysis, and pricing overview</p>
            </div>

            <div className="tab-group">
                <button className={`tab-btn${tab === 'alerts' ? ' active' : ''}`} onClick={() => setTab('alerts')}>
                    <AlertTriangle size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Alerts ({alerts.length})
                </button>
                <button className={`tab-btn${tab === 'mortality' ? ' active' : ''}`} onClick={() => setTab('mortality')}>
                    <BarChart3 size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Mortality
                </button>
                <button className={`tab-btn${tab === 'pricing' ? ' active' : ''}`} onClick={() => setTab('pricing')}>
                    <DollarSign size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Pricing
                </button>
            </div>

            {/* Alerts Tab */}
            {tab === 'alerts' && (
                <div className="card">
                    {alerts.length === 0 ? (
                        <div className="empty-state">
                            <CheckCircle size={48} />
                            <p style={{ marginTop: 8 }}>No alerts — all systems healthy!</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Type</th><th>Severity</th><th>Tank</th><th>Message</th><th>Created</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {alerts.map(a => (
                                        <tr key={a.alert_id}>
                                            <td style={{ fontWeight: 600 }}>{a.alert_type}</td>
                                            <td><StatusBadge status={a.severity} /></td>
                                            <td>{a.tank_name || '—'}</td>
                                            <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</td>
                                            <td>{new Date(a.created_at).toLocaleDateString()}</td>
                                            <td><StatusBadge status={a.status} /></td>
                                            <td>
                                                {a.status !== 'resolved' && (
                                                    <button className="btn btn-sm btn-primary" onClick={() => resolveAlert(a.alert_id)}>Resolve</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Mortality Tab */}
            {tab === 'mortality' && (
                <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header"><span className="card-title">Species Mortality Comparison</span></div>
                        <div style={{ height: 300 }}>
                            {mortality.length > 0 ? (
                                <Bar data={mortalityChart} options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { display: false } },
                                        y: { beginAtZero: true, title: { display: true, text: 'Mortality Rate (%)' } }
                                    }
                                }} />
                            ) : (
                                <div className="empty-state">No mortality data available</div>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><span className="card-title">Detailed Data</span></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Species</th><th>Total Batches</th><th>Total Mortality</th><th>Avg Mortality Rate</th></tr></thead>
                                <tbody>
                                    {mortality.map((m, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{m.species || m.common_name || 'Unknown'}</td>
                                            <td>{m.total_batches || m.batch_count || '—'}</td>
                                            <td>{m.total_deaths || m.total_mortality || '—'}</td>
                                            <td>{parseFloat(m.mortality_rate || m.avg_mortality_rate || 0).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Tab */}
            {tab === 'pricing' && (
                <div className="card">
                    <div className="card-header"><span className="card-title">Batch Pricing Overview</span></div>
                    {pricing.length === 0 ? (
                        <div className="empty-state">No pricing data available</div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Batch</th><th>Species</th><th>Farm</th><th>Production Cost</th><th>Suggested Price</th><th>Margin</th></tr></thead>
                                <tbody>
                                    {pricing.map((p, i) => (
                                        <tr key={i}>
                                            <td>#{p.batch_id}</td>
                                            <td style={{ fontWeight: 600 }}>{p.species || p.common_name || '—'}</td>
                                            <td>{p.farm_name || '—'}</td>
                                            <td>${parseFloat(p.total_production_cost || p.production_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>${parseFloat(p.suggested_price || p.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>{p.target_profit_margin ? `${((parseFloat(p.target_profit_margin) - 1) * 100).toFixed(0)}%` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
