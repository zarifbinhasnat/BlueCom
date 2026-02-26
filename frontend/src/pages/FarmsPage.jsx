import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Factory } from 'lucide-react';

const emptyForm = { farm_name: '', location: '', license_number: '', manager_name: '', phone: '', total_capacity_liters: '', established_date: '' };

export default function FarmsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);

    const load = async () => { setLoading(true); try { setItems(await api.get('/farms')); } catch { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            farm_name: item.farm_name || '', location: item.location || '',
            license_number: item.license_number || '', manager_name: item.manager_name || '',
            phone: item.phone || '', total_capacity_liters: item.total_capacity_liters || '',
            established_date: item.established_date ? item.established_date.split('T')[0] : '',
        });
        setEditId(item.farm_id); setModal('edit');
    };

    const handleSubmit = async () => {
        try {
            const body = { ...form };
            if (body.total_capacity_liters) body.total_capacity_liters = parseFloat(body.total_capacity_liters);
            if (modal === 'edit') await api.put(`/farms/${editId}`, body);
            else await api.post('/farms', body);
            setModal(null); load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this farm?')) return;
        try { await api.del(`/farms/${id}`); load(); } catch (err) { alert(err.message); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Farms</h1><p>{items.length} farms registered</p></div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Farm</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Farm Name</th><th>Location</th><th>License #</th><th>Manager</th><th>Capacity (L)</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map(f => (
                                <tr key={f.farm_id}>
                                    <td style={{ fontWeight: 600 }}><Factory size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--accent)' }} />{f.farm_name}</td>
                                    <td>{f.location}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{f.license_number || '—'}</td>
                                    <td>{f.manager_name || '—'}</td>
                                    <td>{f.total_capacity_liters ? parseFloat(f.total_capacity_liters).toLocaleString() : '—'}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => openEdit(f)}><Pencil size={15} /></button>
                                        <button className="btn-icon" onClick={() => handleDelete(f.farm_id)}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Farm' : 'Add Farm'} onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save</button></>}>
                    <div className="form-group"><label>Farm Name *</label><input className="form-control" value={form.farm_name} onChange={e => set('farm_name', e.target.value)} /></div>
                    <div className="form-group"><label>Location *</label><input className="form-control" value={form.location} onChange={e => set('location', e.target.value)} /></div>
                    <div className="form-row">
                        <div className="form-group"><label>License Number</label><input className="form-control" value={form.license_number} onChange={e => set('license_number', e.target.value)} /></div>
                        <div className="form-group"><label>Manager Name</label><input className="form-control" value={form.manager_name} onChange={e => set('manager_name', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                        <div className="form-group"><label>Capacity (Liters)</label><input className="form-control" type="number" value={form.total_capacity_liters} onChange={e => set('total_capacity_liters', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Established Date</label><input className="form-control" type="date" value={form.established_date} onChange={e => set('established_date', e.target.value)} /></div>
                </Modal>
            )}
        </div>
    );
}
