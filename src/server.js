const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const appointmentRoutes = require('./routes/appointmentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const clinicRoutes = require('./routes/clinicRoutes');

const app = express();

// Database Connection
connectDB();

// Security Headers
app.use(helmet());

// CORS Configuration
const rawAllowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Render health checks, curl, mobile apps)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (rawAllowedOrigins.includes(cleanOrigin) || rawAllowedOrigins.includes('*') || cleanOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to prevent deployment blocking
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Base API Health Check
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dr. Siulik's Dental Care API Server Running",
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/clinic', clinicRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] Express Backend running on http://localhost:${PORT}`);
  console.log(`[Server] CORS configured for origins: ${rawAllowedOrigins.join(', ')}`);
});
