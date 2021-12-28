/**
 * Handle an error.
 * 
 * @param {Error} error 
 * @param {int} status_code 
 */
export function handle_error(res, error, status_code) {
    res.status(status_code);
    res.send(JSON.stringify({ 
        success: false,
        error: error.message 
    }));
}

export function json(str) {
    return JSON.stringify(str);
}