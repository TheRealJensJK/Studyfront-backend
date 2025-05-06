import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = {
            _id: decoded._id,
            email: decoded.email,
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};