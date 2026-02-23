import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Activity } from 'lucide-react';

const emptyForm = { batch_id: '', condition_notes: '', treatment_applied: '', mortality_count: '' };

export default function HealthLogPage() {
    const [logs, setLogs] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const loadData = async () => {
        setLoading(true);
        try {
            const [hl, b] = await Promise.all([
                api.get('/health-logs'),
                api.get('/batches')
            ]);
            setLogs(hl);
            setBatches(b);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async () => {
        try {
            await api.post('/health-logs', {
                batch_id: parseInt(form.batch_id),
                condition_notes: form.condition_notes,
                treatment_applied: form.treatment_applied,
                mortality_count: form.mortality_count ? parseInt(form.mortality_count) : 0,
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
                    <div><h1>Health & Mortality Logs</h1><p>{logs.length} records</p></div>
                    <button className="btn btn-primary" onClick={() => { setForm({ ...emptyForm, batch_id: batches[0]?.batch_id || '' }); setModalOpen(true); }}><Plus size={16} /> Log Health Issue</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Batch</th><th>Date</th><th>Condition</th><th>Treatment</th><th>Mortality</th></tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.log_id}>
                                    <td><Activity size={14} style={{ marginRight: 4, verticalAlign: -2, color: 'var(--danger)' }}/>Batch #{l.batch_id} - {l.common_name}</td>
                                    <td>{new Date(l.log_date).toLocaleDateString()}</td>
                                    <td>{l.condition_notes || '—'}</td>
                                    <td>{l.treatment_applied || 'None'}</td>
                                    <td><strong style={{ color: l.mortality_count > 0 ? 'var(--danger)' : 'inherit' }}>{l.mortality_count}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <Modal title="Log Health observation" onClose={() => setModalOpen(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save Log</button></>}>
                    
                    <div className="form-group"><label>Batch *</label>
                        <select className="form-control" value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                            {batches.map(b => <option key={b.batch_id} value={b.batch_id}>#{b.batch_id} {b.common_name} (Tank {b.tank_name})</option>)}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Condition Notes</label>
                        <textarea className="form-control" value={form.condition_notes} onChange={e => set('condition_notes', e.target.value)} rows="3" placeholder="Describe symptoms or general health..." />
                    </div>
                    
                    <div className="form-group">
                        <label>Treatment Applied (if any)</label>
                        <input type="text" className="form-control" value={form.treatment_applied} onChange={e => set('treatment_applied', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Mortality Count (Dead bodies found)</label>
                        <input type="number" className="form-control" value={form.mortality_count} onChange={e => set('mortality_count', e.target.value)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}
