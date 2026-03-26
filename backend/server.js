require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// ─── Connect DB then start server ────────────────────────────────────────────
connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // ─── Graceful Shutdown ────────────────────────────────────────────────────
    const shutdown = (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ─── Unhandled Promise Rejections ─────────────────────────────────────────
    process.on('unhandledRejection', (err) => {
        console.error('💥 UNHANDLED REJECTION:', err.name, err.message);
        server.close(() => process.exit(1));
    });
});
