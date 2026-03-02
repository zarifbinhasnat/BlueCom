import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

const emptyForm = { company_name: '', contact_person: '', contact_email: '', phone: '', address: '', country_code: '', import_license_no: '' };

export default function CustomersPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);

    const load = async () => { setLoading(true); try { setItems(await api.get('/customers')); } catch { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            company_name: item.company_name || '', contact_person: item.contact_person || '',
            contact_email: item.contact_email || '', phone: item.phone || '',
            address: item.address || '', country_code: item.country_code || '',
            import_license_no: item.import_license_no || '',
        });
        setEditId(item.customer_id); setModal('edit');
    };

    const handleSubmit = async () => {
        try {
            if (modal === 'edit') await api.put(`/customers/${editId}`, form);
            else await api.post('/customers', form);
            setModal(null); load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this customer?')) return;
        try { await api.del(`/customers/${id}`); load(); } catch (err) { alert(err.message); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Customers</h1><p>{items.length} customers</p></div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Customer</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Country</th><th>License #</th><th>Actions</th></tr></thead>
                        <tbody>
                            {items.map(c => (
                                <tr key={c.customer_id}>
                                    <td style={{ fontWeight: 600 }}><Users size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--accent)' }} />{c.company_name}</td>
                                    <td>{c.contact_person || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{c.contact_email || '—'}</td>
                                    <td>{c.country_code || '—'}</td>
                                    <td>{c.import_license_no || '—'}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                                        <button className="btn-icon" onClick={() => handleDelete(c.customer_id)}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Customer' : 'Add Customer'} onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Save</button></>}>
                    <div className="form-group"><label>Company Name *</label><input className="form-control" value={form.company_name} onChange={e => set('company_name', e.target.value)} /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Contact Person</label><input className="form-control" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} /></div>
                        <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                        <div className="form-group"><label>Country Code (e.g. USA)</label><input className="form-control" maxLength={3} value={form.country_code} onChange={e => set('country_code', e.target.value.toUpperCase())} /></div>
                    </div>
                    <div className="form-group"><label>Address</label><textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></div>
                    <div className="form-group"><label>Import License No</label><input className="form-control" value={form.import_license_no} onChange={e => set('import_license_no', e.target.value)} /></div>
                </Modal>
            )}
        </div>
    );
}
