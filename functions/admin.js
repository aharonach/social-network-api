import * as users from './users.js';
import * as helpers from './helpers.js';

export function get_users(filters) {
    return helpers.filter_array(users.admin_get_users(), filters).map( user => {
        const new_user = Object.assign({}, user);
        delete new_user['messages'];
        delete new_user['password'];
        return new_user;
    });
}

export function update_user(id, fields) {
    const { full_name, status, email, password } = fields;
    const user = users.admin_get_user(id);

    let updated_user = {};

    if (user == undefined) {
        throw new Error('User not found');
    }

    if (status !== undefined) {
        if (!Object.values(users.STATUS).includes(status)) {
            throw new Error('Status is invalid');
        }

        updated_user.status = status;
    }

    if (email !== undefined) {
        if (users.email_exists(email)) {
            throw new Error('Email already exists');
        }

        updated_user.email = email.trim().toLowerCase();
    }

    if (full_name !== undefined) {
        updated_user.full_name = full_name.trim();
    }

    if (password !== undefined) {
        updated_user.password = users.hash_password(password);
    }

    Object.assign(user, updated_user);
    return Object.keys(updated_user);
}

export function delete_user(id) {
    const user = users.admin_get_user(id).pop();

    if (user == undefined) {
        throw new Error('User not found');
    }

    user.status = users.STATUS.DELETED;
}

export function message_all_users(text, from_id) {
    const message_text = text?.trim();

    if (!message_text) {
        throw new Error('Message is empty');
    }

    users.get_active_users().forEach(user => users.message_user(user.id, message_text, from_id));
}