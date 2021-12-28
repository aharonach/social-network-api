import { authenticate } from '../functions/users.js';
import { StatusCodes } from 'http-status-codes';
import * as helpers from './helpers.js';

export function user(req, res, next) {
    try {
        const user = authenticate(req.headers.token);
        res.locals.user_id = user.id;
        res.locals.user_role = user.role;
        next();
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.UNAUTHORIZED);
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
        helpers.handle_error(res, e, StatusCodes.UNAUTHORIZED);
    }
}