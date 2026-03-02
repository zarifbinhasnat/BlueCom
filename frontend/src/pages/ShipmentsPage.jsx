import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Truck, Trash2 } from 'lucide-react';

export default function ShipmentsPage() {
    const [items, setItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');

    // Create form
    const [orderId, setOrderId] = useState('');
    const [airwayBill, setAirwayBill] = useState('');
    const [driverName, setDriverName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [transportCost, setTransportCost] = useState('');
    const [packagingCost, setPackagingCost] = useState('');
    const [details, setDetails] = useState([{ batch_id: '', quantity_shipped: '', box_label_id: '' }]);

    const load = async () => {
        setLoading(true);
        try {
            const [s, o, b] = await Promise.all([
                api.get(`/shipments${filterStatus ? `?status=${filterStatus}` : ''}`),
                api.get('/orders'), api.get('/batches')
            ]);
            setItems(s); setOrders(o); setBatches(b);
        } catch { } setLoading(false);
    };
    useEffect(() => { load(); }, [filterStatus]);

    const openCreate = () => {
        setOrderId(orders[0]?.order_id || '');
        setAirwayBill(''); setDriverName(''); setVehicleNumber('');
        setTransportCost(''); setPackagingCost('');
        setDetails([{ batch_id: batches[0]?.batch_id || '', quantity_shipped: '', box_label_id: '' }]);
        setModal(true);
    };

    const addDetail = () => setDetails(d => [...d, { batch_id: batches[0]?.batch_id || '', quantity_shipped: '', box_label_id: '' }]);
    const removeDetail = (i) => setDetails(d => d.filter((_, idx) => idx !== i));
    const setDetail = (i, k, v) => setDetails(d => d.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

    const handleSubmit = async () => {
        try {
            await api.post('/shipments', {
                order_id: parseInt(orderId), airway_bill_no: airwayBill,
                driver_name: driverName, vehicle_number: vehicleNumber,
                transport_cost: parseFloat(transportCost) || 0,
                packaging_cost: parseFloat(packagingCost) || 0,
                details: details.map(d => ({
                    batch_id: parseInt(d.batch_id),
                    quantity_shipped: parseInt(d.quantity_shipped),
                    box_label_id: d.box_label_id,
                })),
            });
            setModal(false); load();
        } catch (err) { alert(err.message); }
    };

    const updateStatus = async (id, status) => {
        try {
            const body = { status };
            if (status === 'delivered') body.actual_delivery_date = new Date().toISOString().split('T')[0];
            await api.patch(`/shipments/${id}/status`, body); load();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div><h1>Shipments</h1><p>{items.length} shipments</p></div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Shipment</button>
                </div>
            </div>

            <div className="filter-bar">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {['preparing', 'in_transit', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Shipment</th><th>Order</th><th>Customer</th><th>AWB</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {items.map(s => (
                                <tr key={s.shipment_id}>
                                    <td><Truck size={14} style={{ marginRight: 4, verticalAlign: -2, color: 'var(--accent)' }} />#{s.shipment_id}</td>
                                    <td>#{s.order_id}</td>
                                    <td style={{ fontWeight: 600 }}>{s.company_name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.airway_bill_no || '—'}</td>
                                    <td>{new Date(s.shipment_date).toLocaleDateString()}</td>
                                    <td>
                                        <select className="form-control" style={{ padding: '3px 8px', fontSize: 11, width: 'auto' }}
                                            value={s.status} onChange={e => updateStatus(s.shipment_id, e.target.value)}>
                                            {['preparing', 'in_transit', 'delivered', 'cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title="New Shipment" onClose={() => setModal(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Create Shipment</button></>}>
                    <div className="form-group"><label>Order *</label>
                        <select className="form-control" value={orderId} onChange={e => setOrderId(e.target.value)}>
                            {orders.map(o => <option key={o.order_id} value={o.order_id}>#{o.order_id} — {o.company_name}</option>)}
                        </select></div>
                    <div className="form-row">
                        <div className="form-group"><label>Airway Bill No</label><input className="form-control" value={airwayBill} onChange={e => setAirwayBill(e.target.value)} /></div>
                        <div className="form-group"><label>Driver Name</label><input className="form-control" value={driverName} onChange={e => setDriverName(e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Vehicle Number</label><input className="form-control" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} /></div>
                        <div className="form-group"><label>Transport Cost</label><input className="form-control" type="number" value={transportCost} onChange={e => setTransportCost(e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Packaging Cost</label><input className="form-control" type="number" value={packagingCost} onChange={e => setPackagingCost(e.target.value)} /></div>

                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch Allocations</label>
                        <button className="btn btn-sm btn-secondary" onClick={addDetail}><Plus size={14} /> Add</button>
                    </div>
                    {details.map((d, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <select className="form-control" style={{ flex: 2 }} value={d.batch_id} onChange={e => setDetail(i, 'batch_id', e.target.value)}>
                                {batches.map(b => <option key={b.batch_id} value={b.batch_id}>#{b.batch_id} {b.common_name} ({b.current_quantity} avail)</option>)}
                            </select>
                            <input className="form-control" style={{ flex: 1 }} type="number" placeholder="Qty" value={d.quantity_shipped} onChange={e => setDetail(i, 'quantity_shipped', e.target.value)} />
                            <input className="form-control" style={{ flex: 1 }} placeholder="Box Label" value={d.box_label_id} onChange={e => setDetail(i, 'box_label_id', e.target.value)} />
                            {details.length > 1 && <button className="btn-icon" onClick={() => removeDetail(i)}><Trash2 size={14} /></button>}
                        </div>
                    ))}
                </Modal>
            )}
        </div>
    );
}
