import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Coffee } from 'lucide-react';

const emptyForm = { batch_id: '', food_type: '', amount_grams: '', cost_per_kg: '', notes: '' };

export default function FeedingLogPage() {
    const [logs, setLogs] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fl, b] = await Promise.all([
                api.get('/feeding-logs'),
                api.get('/batches')
            ]);
            setLogs(fl);
            setBatches(b);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async () => {
        try {
            await api.post('/feeding-logs', {
                batch_id: parseInt(form.batch_id),
                food_type: form.food_type,
                amount_grams: parseFloat(form.amount_grams),
                cost_per_kg: parseFloat(form.cost_per_kg),
                notes: form.notes,
                recorded_by: 1
            });
            setModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Feeding Logs</h1><p>{logs.length} records</p></div>
                    <button className="btn btn-primary" onClick={() => { setForm({ ...emptyForm, batch_id: batches[0]?.batch_id || '' }); setModalOpen(true); }}><Plus size={16} /> Log Feeding</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Batch</th><th>Time</th><th>Food Type</th><th>Amount (g)</th><th>Cost/kg</th><th>Notes</th></tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.log_id}>
                                    <td><Coffee size={14} style={{ marginRight: 4, verticalAlign: -2 }}/>Batch #{l.batch_id} - {l.common_name}</td>
                                    <td>{new Date(l.feed_time).toLocaleString()}</td>
                                    <td>{l.food_type}</td>
                                    <td>{l.amount_grams}</td>
                                    <td>${Number(l.cost_per_kg).toFixed(2)}</td>
                                    <td>{l.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <Modal title="Log Feeding Activity" onClose={() => setModalOpen(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save Log</button></>}>
                    
                    <div className="form-group"><label>Batch *</label>
                        <select className="form-control" value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                            {batches.map(b => <option key={b.batch_id} value={b.batch_id}>#{b.batch_id} {b.common_name} (Tank {b.tank_name})</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Food Type</label><input type="text" className="form-control" value={form.food_type} onChange={e => set('food_type', e.target.value)} /></div>
                        <div className="form-group"><label>Amount (grams)</label><input type="number" step="0.1" className="form-control" value={form.amount_grams} onChange={e => set('amount_grams', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Cost per kg ($)</label><input type="number" step="0.01" className="form-control" value={form.cost_per_kg} onChange={e => set('cost_per_kg', e.target.value)} /></div>
                        <div className="form-group"><label>Notes</label><input type="text" className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
