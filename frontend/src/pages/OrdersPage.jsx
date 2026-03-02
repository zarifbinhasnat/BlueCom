import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Trash2, ClipboardList, ChevronDown } from 'lucide-react';

export default function OrdersPage() {
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');

    // Create form
    const [customerId, setCustomerId] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [notes, setNotes] = useState('');
    const [orderItems, setOrderItems] = useState([{ species_id: '', quantity_requested: '', unit_price: '' }]);

    const load = async () => {
        setLoading(true);
        try {
            const [o, c, s] = await Promise.all([
                api.get(`/orders${filterStatus ? `?status=${filterStatus}` : ''}`),
                api.get('/customers'), api.get('/species')
            ]);
            setItems(o); setCustomers(c); setSpecies(s);
        } catch { } setLoading(false);
    };
    useEffect(() => { load(); }, [filterStatus]);

    const openCreate = () => {
        setCustomerId(customers[0]?.customer_id || '');
        setDeliveryAddress(''); setCurrencyCode('USD'); setNotes('');
        setOrderItems([{ species_id: species[0]?.species_id || '', quantity_requested: '', unit_price: '' }]);
        setModal(true);
    };

    const addItem = () => setOrderItems(prev => [...prev, { species_id: species[0]?.species_id || '', quantity_requested: '', unit_price: '' }]);
    const removeItem = (i) => setOrderItems(prev => prev.filter((_, idx) => idx !== i));
    const setItem = (i, k, v) => setOrderItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

    const handleSubmit = async () => {
        try {
            const body = {
                customer_id: parseInt(customerId),
                delivery_address: deliveryAddress,
                currency_code: currencyCode,
                notes,
                items: orderItems.map(it => ({
                    species_id: parseInt(it.species_id),
                    quantity_requested: parseInt(it.quantity_requested),
                    unit_price: parseFloat(it.unit_price),
                })),
            };
            await api.post('/orders', body);
            setModal(false); load();
        } catch (err) { alert(err.message); }
    };

    const updateStatus = async (id, status) => {
        try { await api.patch(`/orders/${id}/status`, { status }); load(); } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this order?')) return;
        try { await api.del(`/orders/${id}`); load(); } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Orders</h1><p>{items.length} orders</p></div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Order</button>
                </div>
            </div>

            <div className="filter-bar">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {items.map(o => (
                                <tr key={o.order_id}>
                                    <td><ClipboardList size={14} style={{ marginRight: 4, verticalAlign: -2, color: 'var(--accent)' }} />#{o.order_id}</td>
                                    <td style={{ fontWeight: 600 }}>{o.company_name}</td>
                                    <td>{new Date(o.order_date).toLocaleDateString()}</td>
                                    <td>৳{parseFloat(o.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td>
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <select className="form-control" style={{ padding: '3px 8px', fontSize: 11, width: 'auto', appearance: 'none', paddingRight: 20 }}
                                                value={o.status} onChange={e => updateStatus(o.order_id, e.target.value)}>
                                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="btn-icon" onClick={() => handleDelete(o.order_id)}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title="New Order" onClose={() => setModal(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Create Order</button></>}>
                    <div className="form-group"><label>Customer *</label>
                        <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                            {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>)}
                        </select></div>
                    <div className="form-row">
                        <div className="form-group"><label>Currency</label><input className="form-control" value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} /></div>
                        <div className="form-group"><label>Delivery Address</label><input className="form-control" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>

                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Items</label>
                        <button className="btn btn-sm btn-secondary" onClick={addItem}><Plus size={14} /> Add Item</button>
                    </div>
                    {orderItems.map((it, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <select className="form-control" style={{ flex: 2 }} value={it.species_id} onChange={e => setItem(i, 'species_id', e.target.value)}>
                                {species.map(s => <option key={s.species_id} value={s.species_id}>{s.common_name}</option>)}
                            </select>
                            <input className="form-control" style={{ flex: 1 }} type="number" placeholder="Qty" value={it.quantity_requested} onChange={e => setItem(i, 'quantity_requested', e.target.value)} />
                            <input className="form-control" style={{ flex: 1 }} type="number" step="0.01" placeholder="Price/unit" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} />
                            {orderItems.length > 1 && <button className="btn-icon" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}
                        </div>
                    ))}
                </Modal>
            )}
        </div>
    );
}
