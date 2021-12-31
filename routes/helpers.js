import { StatusCodes } from 'http-status-codes';

/**
 * Handle an error.
 * 
 * @param {Error} error 
 * @param {int} status_code 
 */
export function handle_error(res, error, status_code) {
    res.status(status_code);
    res.send(json({ success: false, error: error.message }));
}

export function handle_success(res, data = { success: true }, status_code = StatusCodes.OK) {
    res.status(status_code);
    res.send(json(data));
}

export function json(str) {
    return JSON.stringify(str);
}