import { authenticate } from "../functions/users.js";

export function user(req, res, next) {
    try {
        const user = authenticate(req.headers.token);
        res.locals.user_id = user.id;
        res.locals.user_role = user.role;
        next();
    } catch (e) {
        res.status(401);
        res.send(JSON.stringify({ error: e.message }));
    }
}

export function admin(req, res, next) {
    try {
        const user = authenticate(req.headers.token);
        if (user.role !== 'admin') {
            throw new Error('No permission');
        }
        res.locals.user_id = user.id;
        res.locals.user_role = user.role;
        next();
    } catch (e) {
        res.status(401);
        res.send(JSON.stringify({ error: e.message }));
    }
}