const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const initializeDatabase = require('./database/init_db');

// Initialize database schema
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser('camp_secret_key_2026'));

// Static Files (Serve existing Flask assets seamlessly)
app.use(express.static(path.join(__dirname, 'app', 'static')));
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
    secret: 'camp_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash Messages
app.use(flash());

// Global Locals Middleware
app.use((req, res, next) => {
    res.locals.logged_in = req.session.logged_in || false;
    res.locals.admin_name = req.session.admin_name || 'Admin';
    res.locals.admin_email = req.session.admin_email || '';
    res.locals.messages = req.flash();
    res.locals.active_page = '';
    res.locals.page_title = 'CAMP ERP';
    next();
});

// Import & Mount Routes
const authRoutes = require('./src/middleware/routes/authRoutes');
const dashboardRoutes = require('./src/middleware/routes/dashboardRoutes');
const studentRoutes = require('./src/middleware/routes/studentRoutes');
const teacherRoutes = require('./src/middleware/routes/teacherRoutes');
const subjectRoutes = require('./src/middleware/routes/subjectRoutes');
const attendanceRoutes = require('./src/middleware/routes/attendanceRoutes');
const qrRoutes = require('./src/middleware/routes/qrRoutes');
const reportRoutes = require('./src/middleware/routes/reportRoutes');
const teacherPortalRoutes = require('./src/middleware/routes/teacherPortalRoutes');
const studentPortalRoutes = require('./src/middleware/routes/studentPortalRoutes');

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', studentRoutes);
app.use('/', teacherRoutes);
app.use('/', subjectRoutes);
app.use('/', attendanceRoutes);
app.use('/', qrRoutes);
app.use('/', reportRoutes);
app.use('/', teacherPortalRoutes);
app.use('/', studentPortalRoutes);

// Start Server with Port Fallback
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`=================================================`);
        console.log(`🎓 CAMP ERP Server running on http://127.0.0.1:${port}`);
        console.log(`   Engine: Node.js & Express.js`);
        console.log(`   Database: SQLite3 (better-sqlite3)`);
        console.log(`=================================================`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is currently in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);

