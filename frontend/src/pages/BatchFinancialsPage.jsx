import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { DollarSign, Save } from 'lucide-react';

export default function BatchFinancialsPage() {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [financials, setFinancials] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state for editing financials
    const [form, setForm] = useState({
        total_labor_cost: 0,
        water_electricity_cost: 0,
        medication_cost: 0
    });

    useEffect(() => {
        loadBatches();
    }, []);

    useEffect(() => {
        if (selectedBatchId) {
            loadFinancials(selectedBatchId);
        } else {
            setFinancials(null);
            setPricing(null);
        }
    }, [selectedBatchId]);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const data = await api.get('/batches');
            setBatches(data);
            if (data.length > 0) {
                setSelectedBatchId(data[0].batch_id.toString());
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const loadFinancials = async (id) => {
        setLoading(true);
        try {
            const finData = await api.get(`/batches/${id}/financials`);
            setFinancials(finData);
            setForm({
                total_labor_cost: finData.total_labor_cost || 0,
                water_electricity_cost: finData.water_electricity_cost || 0,
                medication_cost: finData.medication_cost || 0
            });

            // Attempt to load pricing if the batch is ready
            try {
                const priceData = await api.get(`/batches/${id}/pricing`);
                setPricing(priceData);
            } catch (e) {
                // Batch likely not ready for sale, pricing usually 404s
                setPricing(null);
            }

        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!selectedBatchId) return;
        setSaving(true);
        try {
            await api.put(`/batches/${selectedBatchId}/financials`, {
                total_labor_cost: parseFloat(form.total_labor_cost) || 0,
                water_electricity_cost: parseFloat(form.water_electricity_cost) || 0,
                medication_cost: parseFloat(form.medication_cost) || 0,
                // Feed cost is typically readonly/managed by triggers, but pass it back if needed
                total_feed_cost: financials?.total_feed_cost || 0
            });
            alert('Financials saved successfully!');
            loadFinancials(selectedBatchId);
        } catch (err) {
            alert(err.message || 'Failed to save financials');
        }
        setSaving(false);
    };

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    if (loading && batches.length === 0) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Batch Financials</h1>
                        <p>Manage overhead and manual costs per batch</p>
                    </div>
                </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: '2rem' }}>
                <label style={{ marginRight: '1rem', fontWeight: 600 }}>Select Batch:</label>
                <select 
                    value={selectedBatchId} 
                    onChange={e => setSelectedBatchId(e.target.value)}
                    style={{ minWidth: '300px' }}
                >
                    {batches.map(b => (
                        <option key={b.batch_id} value={b.batch_id}>
                            #{b.batch_id} - {b.common_name} (Tank {b.tank_name}) - {b.stage}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : financials ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    
                    {/* EDITABLE FINANCIALS */}
                    <div className="card">
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                            <DollarSign size={20} style={{ marginRight: '8px', color: 'var(--primary)' }}/>
                            Overhead Costs
                        </h2>

                        <div className="form-group">
                            <label>Total Feed Cost (Auto-calculated)</label>
                            <input 
                                className="form-control" 
                                type="text" 
                                value={`$${Number(financials.total_feed_cost || 0).toFixed(2)}`} 
                                disabled 
                                style={{ backgroundColor: '#f1f5f9' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Labor Cost ($)</label>
                            <input 
                                className="form-control" 
                                type="number" 
                                step="0.01"
                                value={form.total_labor_cost} 
                                onChange={e => set('total_labor_cost', e.target.value)} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Water & Electricity Cost ($)</label>
                            <input 
                                className="form-control" 
                                type="number" 
                                step="0.01"
                                value={form.water_electricity_cost} 
                                onChange={e => set('water_electricity_cost', e.target.value)} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Medication Cost ($)</label>
                            <input 
                                className="form-control" 
                                type="number" 
                                step="0.01"
                                value={form.medication_cost} 
                                onChange={e => set('medication_cost', e.target.value)} 
                            />
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Costs'}
                        </button>
                    </div>

                    {/* PRICING AND SUMMARY STATS */}
                    <div className="card" style={{ backgroundColor: '#f8fafc' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Financial Summary</h2>
                        
                        <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Cost to Date</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                ${ (
                                    parseFloat(financials.total_feed_cost || 0) +
                                    parseFloat(financials.total_labor_cost || 0) + 
                                    parseFloat(financials.water_electricity_cost || 0) + 
                                    parseFloat(financials.medication_cost || 0)
                                ).toFixed(2) }
                            </p>
                        </div>

                        {pricing && (
                            <div style={{ marginTop: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Pricing & Analytics</h3>
                                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Expected Revenue</td>
                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>${Number(pricing.expected_revenue).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Projected Profit</td>
                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: pricing.projected_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                ${Number(pricing.projected_profit).toFixed(2)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Suggested Price / kg</td>
                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>${Number(pricing.suggested_price_per_kg).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Growth Rate</td>
                                            <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{Number(pricing.growth_rate_grams_per_day).toFixed(2)} g/day</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!pricing && (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', marginTop: '1rem' }}>
                                Advanced pricing analytics will be available when this batch reaches harvest stage or has enough tracking data.
                            </p>
                        )}
                    </div>

                </div>
            ) : null}
        </div>
    );
}
