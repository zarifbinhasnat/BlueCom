const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Import routes
const speciesRoutes = require('./routes/speciesRoutes');
const farmRoutes = require('./routes/farmRoutes');
const tankRoutes = require('./routes/tankRoutes');
const batchRoutes = require('./routes/batchRoutes');
const waterLogRoutes = require('./routes/waterLogRoutes');
const feedingLogRoutes = require('./routes/feedingLogRoutes');
const healthLogRoutes = require('./routes/healthLogRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Basic Route
app.get('/', (req, res) => {
    res.json({ 
        message: 'BLUECON Aquaculture Management System API',
        version: '1.0.0',
        endpoints: {
            species: '/api/species',
            farms: '/api/farms',
            tanks: '/api/tanks',
            batches: '/api/batches',
            waterLogs: '/api/water-logs',
            feedingLogs: '/api/feeding-logs',
            healthLogs: '/api/health-logs',
            customers: '/api/customers',
            orders: '/api/orders',
            shipments: '/api/shipments',
            analytics: '/api/analytics'
        }
    });
});

// API Routes
app.use('/api/species', speciesRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/water-logs', waterLogRoutes);
app.use('/api/feeding-logs', feedingLogRoutes);
app.use('/api/health-logs', healthLogRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
