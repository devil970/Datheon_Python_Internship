import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import contactRouter from './routes/contact.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security headers
app.use(helmet());

// ── CORS — only allow your portfolio origin (update in .env for production)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. direct API calls / mobile)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['POST'],
}));

// ── Body parsing
app.use(express.json({ limit: '10kb' }));

// ── Global rate limiter (100 requests per 15 min per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));

// ── Routes
app.use('/api/contact', contactRouter);

// ── 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ── Global error handler
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
