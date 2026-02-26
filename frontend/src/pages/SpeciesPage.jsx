import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Fish } from 'lucide-react';

const emptyForm = { common_name: '', scientific_name: '', description: '', target_profit_margin: '1.30', ideal_temp_min: '', ideal_temp_max: '', ideal_ph_min: '', ideal_ph_max: '' };

export default function SpeciesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | 'edit'
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);

    const load = async () => {
        setLoading(true);
        try { setItems(await api.get('/species')); } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            common_name: item.common_name || '', scientific_name: item.scientific_name || '',
            description: item.description || '', target_profit_margin: item.target_profit_margin || '1.30',
            ideal_temp_min: item.ideal_temp_min || '', ideal_temp_max: item.ideal_temp_max || '',
            ideal_ph_min: item.ideal_ph_min || '', ideal_ph_max: item.ideal_ph_max || '',
        });
        setEditId(item.species_id);
        setModal('edit');
    };

    const handleSubmit = async () => {
        try {
            const body = { ...form, target_profit_margin: parseFloat(form.target_profit_margin) || 1.3 };
            if (form.ideal_temp_min) body.ideal_temp_min = parseFloat(form.ideal_temp_min);
            if (form.ideal_temp_max) body.ideal_temp_max = parseFloat(form.ideal_temp_max);
            if (form.ideal_ph_min) body.ideal_ph_min = parseFloat(form.ideal_ph_min);
            if (form.ideal_ph_max) body.ideal_ph_max = parseFloat(form.ideal_ph_max);

            if (modal === 'edit') {
                await api.put(`/species/${editId}`, body);
            } else {
                await api.post('/species', body);
            }
            setModal(null);
            load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this species?')) return;
        try { await api.del(`/species/${id}`); load(); } catch (err) { alert(err.message); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Species Catalog</h1>
                        <p>{items.length} species registered</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Species</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Scientific Name</th>
                                <th>Profit Margin</th>
                                <th>Temp Range (°C)</th>
                                <th>pH Range</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(s => (
                                <tr key={s.species_id}>
                                    <td style={{ fontWeight: 600 }}><Fish size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--accent)' }} />{s.common_name}</td>
                                    <td style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{s.scientific_name}</td>
                                    <td>{((parseFloat(s.target_profit_margin) - 1) * 100).toFixed(0)}%</td>
                                    <td>{s.ideal_temp_min && s.ideal_temp_max ? `${s.ideal_temp_min}–${s.ideal_temp_max}` : '—'}</td>
                                    <td>{s.ideal_ph_min && s.ideal_ph_max ? `${s.ideal_ph_min}–${s.ideal_ph_max}` : '—'}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={15} /></button>
                                        <button className="btn-icon" onClick={() => handleDelete(s.species_id)}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Species' : 'Add Species'} onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save</button></>}>
                    <div className="form-group">
                        <label>Common Name *</label>
                        <input className="form-control" value={form.common_name} onChange={e => set('common_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Scientific Name</label>
                        <input className="form-control" value={form.scientific_name} onChange={e => set('scientific_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Target Profit Margin (e.g. 1.30 = 30%)</label>
                        <input className="form-control" type="number" step="0.01" value={form.target_profit_margin} onChange={e => set('target_profit_margin', e.target.value)} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Ideal Temp Min (°C)</label>
                            <input className="form-control" type="number" step="0.1" value={form.ideal_temp_min} onChange={e => set('ideal_temp_min', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Ideal Temp Max (°C)</label>
                            <input className="form-control" type="number" step="0.1" value={form.ideal_temp_max} onChange={e => set('ideal_temp_max', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Ideal pH Min</label>
                            <input className="form-control" type="number" step="0.1" value={form.ideal_ph_min} onChange={e => set('ideal_ph_min', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Ideal pH Max</label>
                            <input className="form-control" type="number" step="0.1" value={form.ideal_ph_max} onChange={e => set('ideal_ph_max', e.target.value)} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
