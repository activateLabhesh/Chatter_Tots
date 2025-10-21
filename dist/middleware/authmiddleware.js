import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
export const authenticate = (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
    }
    if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload.email) {
            res.status(401).json({ message: 'Authentication failed: Token is missing required information.' });
            return;
        }
        req.user = payload;
        req.userEmail = payload.email;
        next();
    }
    catch (err) {
        res.status(403).json({ message: 'Invalid token' });
        return;
    }
};
