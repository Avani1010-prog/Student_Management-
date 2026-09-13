function requireAuth(req, res, next) {
    if (!req.session || !req.session.logged_in) {
        return res.redirect('/login');
    }
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.session || !req.session.logged_in) {
            return res.redirect('/login');
        }
        if (req.session.user_role !== role) {
            req.flash('warning', 'Access Denied: You do not have permission to view this page.');
            if (req.session.user_role === 'teacher') return res.redirect('/teacher/dashboard');
            if (req.session.user_role === 'student') return res.redirect('/student/dashboard');
            return res.redirect('/dashboard');
        }
        next();
    };
}

function requireAnyRole(roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.logged_in) {
            return res.redirect('/login');
        }
        if (!roles.includes(req.session.user_role)) {
            req.flash('warning', 'Access Denied: You do not have permission to view this page.');
            if (req.session.user_role === 'teacher') return res.redirect('/teacher/dashboard');
            if (req.session.user_role === 'student') return res.redirect('/student/dashboard');
            return res.redirect('/dashboard');
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole,
    requireAnyRole
};
