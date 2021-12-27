import * as users from './users.js';
import * as helpers from './helpers.js';

export function get_users(filters) {
    return helpers.filter_array(users.admin_get_users(), filters);
}