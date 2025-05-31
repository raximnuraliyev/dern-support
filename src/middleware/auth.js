// Authentication middleware to check if user is logged in
export const checkUserAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  return res.redirect('/login');
};

// Check if user has admin role
export const checkAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  req.flash('error', 'You do not have permission to access this page');
  return res.redirect('/dashboard');
};

// Check if user is not authenticated (for login/register pages)
export const checkUserNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  return res.redirect('/dashboard');
};