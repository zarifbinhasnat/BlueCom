import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Pencil, Trash2, FlaskConical } from 'lucide-react';

const emptyForm = { farm_id: '', tank_name: '', tank_type: 'Recirculating', volume_liters: '', is_active: true };

export default function TanksPage() {
    const [items, setItems] = useState([]);
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [filterFarm, setFilterFarm] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const [t, f] = await Promise.all([api.get(`/tanks${filterFarm ? `?farm_id=${filterFarm}` : ''}`), api.get('/farms')]);
            setItems(t); setFarms(f);
        } catch { } setLoading(false);
    };
    useEffect(() => { load(); }, [filterFarm]);

    const openCreate = () => { setForm({ ...emptyForm, farm_id: farms[0]?.farm_id || '' }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ farm_id: item.farm_id, tank_name: item.tank_name || '', tank_type: item.tank_type || 'Recirculating', volume_liters: item.volume_liters || '', is_active: item.is_active });
        setEditId(item.tank_id); setModal('edit');
    };

    const handleSubmit = async () => {
        try {
            const body = { ...form, farm_id: parseInt(form.farm_id), volume_liters: parseFloat(form.volume_liters) };
            if (modal === 'edit') await api.put(`/tanks/${editId}`, body);
            else await api.post('/tanks', body);
            setModal(null); load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this tank?')) return;
        try { await api.del(`/tanks/${id}`); load(); } catch (err) { alert(err.message); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Tanks</h1><p>{items.length} tanks</p></div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Tank</button>
                </div>
            </div>

            <div className="filter-bar">
                <select value={filterFarm} onChange={e => setFilterFarm(e.target.value)}>
                    <option value="">All Farms</option>
                    {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
                </select>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Tank</th><th>Farm</th><th>Type</th><th>Volume (L)</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {items.map(t => (
                                <tr key={t.tank_id}>
                                    <td style={{ fontWeight: 600 }}><FlaskConical size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--accent)' }} />{t.tank_name}</td>
                                    <td>{t.farm_name || `Farm #${t.farm_id}`}</td>
                                    <td><StatusBadge status={t.tank_type} /></td>
                                    <td>{parseFloat(t.volume_liters).toLocaleString()}</td>
                                    <td><StatusBadge status={t.is_active ? 'active' : 'inactive'} /></td>
                                    <td>
                                        <button className="btn-icon" onClick={() => openEdit(t)}><Pencil size={15} /></button>
                                        <button className="btn-icon" onClick={() => handleDelete(t.tank_id)}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Tank' : 'Add Tank'} onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save</button></>}>
                    <div className="form-group"><label>Farm *</label>
                        <select className="form-control" value={form.farm_id} onChange={e => set('farm_id', e.target.value)}>
                            {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
                        </select></div>
                    <div className="form-row">
                        <div className="form-group"><label>Tank Name *</label><input className="form-control" value={form.tank_name} onChange={e => set('tank_name', e.target.value)} /></div>
                        <div className="form-group"><label>Type</label>
                            <select className="form-control" value={form.tank_type} onChange={e => set('tank_type', e.target.value)}>
                                {['Pond', 'Recirculating', 'Flow-through', 'Quarantine'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Volume (Liters) *</label><input className="form-control" type="number" value={form.volume_liters} onChange={e => set('volume_liters', e.target.value)} /></div>
                        <div className="form-group"><label>Active</label>
                            <select className="form-control" value={form.is_active} onChange={e => set('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option><option value="false">Inactive</option>
                            </select></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
