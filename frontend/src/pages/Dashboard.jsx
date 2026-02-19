import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
    Fish, Factory, Package, AlertTriangle, TrendingUp,
    Truck, ClipboardList, Droplets
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, BarElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import StatusBadge from '../components/StatusBadge';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, BarElement, Tooltip, Legend, Filler
);

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [profitData, setProfitData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [species, farms, batches, orders, shipments, alerts, profit] = await Promise.all([
                    api.get('/species'),
                    api.get('/farms'),
                    api.get('/batches'),
                    api.get('/orders'),
                    api.get('/shipments'),
                    api.get('/analytics/alerts?status=open'),
                    api.get('/analytics/profit-over-time').catch(() => []),
                ]);

                const totalFish = batches.reduce((sum, b) => sum + (b.current_quantity || 0), 0);
                const stageCounts = {};
                batches.forEach(b => { stageCounts[b.stage] = (stageCounts[b.stage] || 0) + 1; });

                const totalOrderValue = orders.reduce((s, o) => s + parseFloat(o.total_value || 0), 0);
                const totalProfit = profit.reduce((s, p) => s + parseFloat(p.profit || 0), 0);

                setStats({
                    speciesCount: species.length,
                    farmCount: farms.length,
                    batchCount: batches.length,
                    totalFish,
                    stageCounts,
                    orderCount: orders.length,
                    totalOrderValue,
                    totalProfit,
                    alertCount: alerts.length,
                    recentOrders: orders.slice(0, 5),
                    inTransitShipments: shipments.filter(s => s.status === 'in_transit'),
                    allAlerts: alerts.slice(0, 5),
                });
                setProfitData(profit);
            } catch (err) {
                console.error('Dashboard load error:', err);
                setStats({
                    speciesCount: 0, farmCount: 0, batchCount: 0, totalFish: 0,
                    stageCounts: {}, orderCount: 0, totalOrderValue: 0, totalProfit: 0,
                    alertCount: 0, recentOrders: [], inTransitShipments: [],
                    allAlerts: [],
                });
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    if (loading) {
        return <div className="loading"><div className="spinner"></div><span>Loading dashboard...</span></div>;
    }

    /* ---- Profit Over Time line chart (like the reference image) ---- */
    const months = profitData.map(p => {
        const d = new Date(p.month);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    const profitChartData = {
        labels: months,
        datasets: [
            {
                label: 'Revenue',
                data: profitData.map(p => parseFloat(p.revenue)),
                borderColor: '#4a6741',
                backgroundColor: 'rgba(74, 103, 65, 0.08)',
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointBackgroundColor: '#4a6741',
                pointHoverRadius: 6,
                borderWidth: 2.5,
            },
            {
                label: 'Profit',
                data: profitData.map(p => parseFloat(p.profit)),
                borderColor: '#3a6ea5',
                backgroundColor: 'rgba(58, 110, 165, 0.06)',
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointBackgroundColor: '#3a6ea5',
                pointHoverRadius: 6,
                borderWidth: 2.5,
            },
        ]
    };

    const profitChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', align: 'end', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } },
            tooltip: {
                backgroundColor: '#1a1a1a',
                titleFont: { size: 13 }, bodyFont: { size: 12 },
                padding: 12, cornerRadius: 8,
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ৳${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#999' },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: {
                    font: { size: 11 }, color: '#999',
                    callback: v => `৳${(v / 1000).toFixed(0)}k`,
                },
            },
        },
    };

    /* ---- Stage doughnut ---- */
    const stageData = {
        labels: Object.keys(stats.stageCounts),
        datasets: [{
            data: Object.values(stats.stageCounts),
            backgroundColor: ['#3a6ea5', '#c4922a', '#4a6741', '#c44a3f', '#6b8f5e'],
            borderWidth: 0,
        }]
    };

    /* ---- Compute latest‑month stats for the header ---- */
    const latestProfit = profitData.length > 0 ? profitData[profitData.length - 1] : null;

    return (
        <div>
            <div className="page-header">
                <h1>Hi, here&apos;s what&apos;s happening in your farms</h1>
                <p>Bluecon Aquaculture Management — Real-time overview</p>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <KpiCard icon={<Fish size={20} />} value={stats.totalFish.toLocaleString()} label="Total Fish Stock" to="/batches" />
                <KpiCard icon={<Package size={20} />} value={stats.batchCount} label="Active Batches" to="/batches" />
                <KpiCard icon={<ClipboardList size={20} />} value={stats.orderCount} label="Total Orders" to="/orders" />
                <KpiCard icon={<TrendingUp size={20} />} value={`৳${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} label="Total Profit" to="/analytics" />
                <KpiCard icon={<Factory size={20} />} value={stats.farmCount} label="Farms" to="/farms" />
                <KpiCard icon={<Droplets size={20} />} value={stats.speciesCount} label="Species" to="/species" />
                <KpiCard icon={<Truck size={20} />} value={stats.inTransitShipments.length} label="Shipments In Transit" to="/shipments" />
                <KpiCard icon={<AlertTriangle size={20} />} value={stats.alertCount} label="Open Alerts" accent={stats.alertCount > 0 ? 'danger' : ''} to="/analytics" />
            </div>

            {/* ===== PROFIT CHART (central, large) ===== */}
            <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
                <div className="card-header" style={{ marginBottom: 4 }}>
                    <div>
                        <span className="card-title">Profit Over Time</span>
                        {latestProfit && (
                            <div style={{ marginTop: 6 }}>
                                <span style={{ fontSize: 28, fontWeight: 700 }}>
                                    ৳{parseFloat(latestProfit.profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>
                                    this month's profit
                                </span>
                            </div>
                        )}
                    </div>
                    {latestProfit && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Revenue</div>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>৳{parseFloat(latestProfit.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>Total Cost</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>৳{parseFloat(latestProfit.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    )}
                </div>
                <div style={{ height: 300 }}>
                    {profitData.length > 0 ? (
                        <Line data={profitChartData} options={profitChartOptions} />
                    ) : (
                        <div className="empty-state">
                            <p>No profit data yet. Run <code>monthly_profit.sql</code> to seed data.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stage chart + Recent Orders side by side */}
            <div className="charts-grid">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Recent Orders</span>
                    </div>
                    {stats.recentOrders.length === 0 ? (
                        <div className="empty-state">No orders yet</div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>ID</th><th>Customer</th><th>Value</th><th>Status</th></tr></thead>
                                <tbody>
                                    {stats.recentOrders.map(o => (
                                        <tr key={o.order_id}>
                                            <td>#{o.order_id}</td>
                                            <td>{o.company_name}</td>
                                            <td>৳{parseFloat(o.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td><StatusBadge status={o.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Batch Stage Distribution</span>
                    </div>
                    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Doughnut data={stageData} options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } },
                            cutout: '60%',
                        }} />
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header">
                    <span className="card-title">Active Alerts</span>
                </div>
                {stats.allAlerts.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px 20px' }}>
                        <AlertTriangle size={36} />
                        <p>No open alerts — all systems normal!</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Type</th><th>Severity</th><th>Message</th></tr></thead>
                            <tbody>
                                {stats.allAlerts.map(a => (
                                    <tr key={a.alert_id}>
                                        <td>{a.alert_type}</td>
                                        <td><StatusBadge status={a.severity} /></td>
                                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function KpiCard({ icon, value, label, accent, to }) {
    const navigate = useNavigate();
    return (
        <div className="kpi-card" style={{ ...(accent === 'danger' ? { borderColor: 'var(--status-danger)' } : {}), cursor: to ? 'pointer' : 'default' }}
            onClick={() => to && navigate(to)}>
            <div className="kpi-icon" style={accent === 'danger' ? { background: 'rgba(196,74,63,0.1)', color: 'var(--status-danger)' } : {}}>
                {icon}
            </div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
        </div>
    );
}
