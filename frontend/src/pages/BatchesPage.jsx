import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

const emptyForm = { species_id: '', tank_id: '', birth_date: '', initial_quantity: '', stage: 'Fry', estimated_harvest_date: '' };

export default function BatchesPage() {
    const [items, setItems] = useState([]);
    const [species, setSpecies] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [filterStage, setFilterStage] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const [b, s, t] = await Promise.all([
                api.get(`/batches${filterStage ? `?stage=${filterStage}` : ''}`),
                api.get('/species'), api.get('/tanks')
            ]);
            setItems(b); setSpecies(s); setTanks(t);
        } catch { } setLoading(false);
    };
    useEffect(() => { load(); }, [filterStage]);

    const openCreate = () => {
        setForm({ ...emptyForm, species_id: species[0]?.species_id || '', tank_id: tanks[0]?.tank_id || '' });
        setEditId(null); setModal('create');
    };
    const openEdit = (item) => {
        setForm({
            species_id: item.species_id, tank_id: item.tank_id,
            birth_date: item.birth_date ? item.birth_date.split('T')[0] : '',
            initial_quantity: item.initial_quantity, current_quantity: item.current_quantity,
            stage: item.stage, estimated_harvest_date: item.estimated_harvest_date ? item.estimated_harvest_date.split('T')[0] : '',
        });
        setEditId(item.batch_id); setModal('edit');
    };

    const handleSubmit = async () => {
        try {
            const body = {
                species_id: parseInt(form.species_id), tank_id: parseInt(form.tank_id),
                birth_date: form.birth_date, initial_quantity: parseInt(form.initial_quantity),
                stage: form.stage, estimated_harvest_date: form.estimated_harvest_date || null,
            };
            if (modal === 'edit') {
                body.current_quantity = parseInt(form.current_quantity || form.initial_quantity);
                await api.put(`/batches/${editId}`, body);
            } else {
                await api.post('/batches', body);
            }
            setModal(null); load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this batch?')) return;
        try { await api.del(`/batches/${id}`); load(); } catch (err) { alert(err.message); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Batches</h1><p>{items.length} batches tracked</p></div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Batch</button>
                </div>
            </div>

            <div className="filter-bar">
                <select value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                    <option value="">All Stages</option>
                    {['Fry', 'Juvenile', 'Adult', 'Quarantine', 'Ready for Sale'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>ID</th><th>Species</th><th>Farm / Tank</th><th>Stage</th><th>Qty (init → current)</th><th>Birth Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            {items.map(b => (
                                <tr key={b.batch_id}>
                                    <td><Package size={14} style={{ marginRight: 4, verticalAlign: -2, color: 'var(--accent)' }} />#{b.batch_id}</td>
                                    <td style={{ fontWeight: 600 }}>{b.common_name}</td>
                                    <td>{b.farm_name} / {b.tank_name}</td>
                                    <td><StatusBadge status={b.stage} /></td>
                                    <td>{b.initial_quantity.toLocaleString()} → <strong>{b.current_quantity.toLocaleString()}</strong></td>
                                    <td>{b.birth_date ? new Date(b.birth_date).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => openEdit(b)}><Pencil size={15} /></button>
                                        <button className="btn-icon" onClick={() => handleDelete(b.batch_id)}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Batch' : 'New Batch'} onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save</button></>}>
                    <div className="form-row">
                        <div className="form-group"><label>Species *</label>
                            <select className="form-control" value={form.species_id} onChange={e => set('species_id', e.target.value)}>
                                {species.map(s => <option key={s.species_id} value={s.species_id}>{s.common_name}</option>)}
                            </select></div>
                        <div className="form-group"><label>Tank *</label>
                            <select className="form-control" value={form.tank_id} onChange={e => set('tank_id', e.target.value)}>
                                {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_name} ({t.farm_name || `Farm #${t.farm_id}`})</option>)}
                            </select></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Birth Date *</label><input className="form-control" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} /></div>
                        <div className="form-group"><label>Initial Quantity *</label><input className="form-control" type="number" value={form.initial_quantity} onChange={e => set('initial_quantity', e.target.value)} /></div>
                    </div>
                    {modal === 'edit' && (
                        <div className="form-group"><label>Current Quantity</label><input className="form-control" type="number" value={form.current_quantity} onChange={e => set('current_quantity', e.target.value)} /></div>
                    )}
                    <div className="form-row">
                        <div className="form-group"><label>Stage</label>
                            <select className="form-control" value={form.stage} onChange={e => set('stage', e.target.value)}>
                                {['Fry', 'Juvenile', 'Adult', 'Quarantine', 'Ready for Sale'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select></div>
                        <div className="form-group"><label>Est. Harvest Date</label><input className="form-control" type="date" value={form.estimated_harvest_date} onChange={e => set('estimated_harvest_date', e.target.value)} /></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
