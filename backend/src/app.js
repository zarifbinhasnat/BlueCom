const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // logger if needed, but keeping it simple for now
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Bluecon Aquaculture Management System API' });
});

// Routes placeholders
// app.use('/api/auth', authRoutes);
// app.use('/api/master-data', masterDataRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
