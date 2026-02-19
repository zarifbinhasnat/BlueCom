const statusMap = {
    // Batch stages
    'Fry': 'info',
    'Juvenile': 'warning',
    'Adult': 'success',
    'Quarantine': 'danger',
    'Ready for Sale': 'success',
    // Order statuses
    'pending': 'pending',
    'processing': 'info',
    'shipped': 'warning',
    'delivered': 'success',
    'cancelled': 'danger',
    // Shipment statuses
    'preparing': 'pending',
    'in_transit': 'warning',
    // Alert severity
    'low': 'info',
    'medium': 'warning',
    'high': 'danger',
    'critical': 'danger',
    // Alert status
    'open': 'danger',
    'acknowledged': 'warning',
    'resolved': 'success',
    // Water log
    'normal': 'success',
    'warning': 'warning',
    'critical': 'danger',
    // Tank types
    'Pond': 'info',
    'Recirculating': 'success',
    'Flow-through': 'warning',
    'active': 'success',
    'inactive': 'pending',
};

export default function StatusBadge({ status }) {
    const type = statusMap[status] || 'info';
    return <span className={`badge badge-${type}`}>{status}</span>;
}
