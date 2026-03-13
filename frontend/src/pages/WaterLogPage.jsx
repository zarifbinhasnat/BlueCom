import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Droplet } from 'lucide-react';

const emptyForm = { tank_id: '', ph_level: '', temperature: '', dissolved_oxygen: '', ammonia_level: '' };

export default function WaterLogPage() {
    const [logs, setLogs] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const loadData = async () => {
        setLoading(true);
        try {
            const [wl, t] = await Promise.all([
                api.get('/water-logs'),
                api.get('/tanks')
            ]);
            setLogs(wl);
            setTanks(t);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async () => {
        try {
            await api.post('/water-logs', {
                tank_id: parseInt(form.tank_id),
                ph_level: parseFloat(form.ph_level),
                temperature: parseFloat(form.temperature),
                dissolved_oxygen: parseFloat(form.dissolved_oxygen),
                ammonia_level: parseFloat(form.ammonia_level),
                measured_by_user_id: null
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
                    <div><h1>Water Quality Logs</h1><p>{logs.length} records</p></div>
                    <button className="btn btn-primary" onClick={() => { setForm({ ...emptyForm, tank_id: tanks[0]?.tank_id || '' }); setModalOpen(true); }}><Plus size={16} /> New Log</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Tank</th><th>Time</th><th>pH</th><th>Temp (°C)</th><th>DO (mg/L)</th><th>Ammonia</th><th>Status</th></tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.log_id}>
                                    <td><Droplet size={14} style={{ marginRight: 4, verticalAlign: -2, color: 'var(--accent)' }}/>{l.tank_name}</td>
                                    <td>{new Date(l.measured_at).toLocaleString()}</td>
                                    <td>{l.ph_level}</td>
                                    <td>{l.temperature}</td>
                                    <td>{l.dissolved_oxygen}</td>
                                    <td>{l.ammonia_level}</td>
                                    <td><StatusBadge status={l.status === 'optimal' ? 'Active' : l.status === 'suboptimal' ? 'Warning' : 'Critical'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <Modal title="Log Water Quality" onClose={() => setModalOpen(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save Parameter</button></>}>
                    
                    <div className="form-group"><label>Tank *</label>
                        <select className="form-control" value={form.tank_id} onChange={e => set('tank_id', e.target.value)}>
                            {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_name} ({t.farm_name})</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>pH Level</label><input type="number" step="0.1" className="form-control" value={form.ph_level} onChange={e => set('ph_level', e.target.value)} /></div>
                        <div className="form-group"><label>Temperature (°C)</label><input type="number" step="0.1" className="form-control" value={form.temperature} onChange={e => set('temperature', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Dissolved Oxygen</label><input type="number" step="0.1" className="form-control" value={form.dissolved_oxygen} onChange={e => set('dissolved_oxygen', e.target.value)} /></div>
                        <div className="form-group"><label>Ammonia</label><input type="number" step="0.01" className="form-control" value={form.ammonia_level} onChange={e => set('ammonia_level', e.target.value)} /></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
