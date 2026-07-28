import express from 'express';
import 'dotenv/config';
import emailRoutes from './email/emailRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');
app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'EventoraX backend running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
