import * as users from './users.js';
import * as helpers from './helpers.js';

export function get_users(filters) {
    return helpers.filter_array(users.admin_get_users(), filters)
        .map(user => helpers.delete_keys(user, ['messages', 'password']));
}

export function update_user(id, fields) {
    const { full_name, status, email, password, role } = fields;
    const user = users.admin_get_user(id);

    let updated_user = {};

    if (user == undefined) {
        throw new Error('User not found');
    }

    // Don't allow to edit admin's status or role
    if (user.role != users.ROLES.ADMIN) {
        if (status != undefined) {
            if (!Object.values(users.STATUS).includes(status)) {
                throw new Error('Status is invalid');
            }

            if ( status != users.STATUS.DELETED ) {
                updated_user.status = status;
            }
        }

        if (role !== undefined) {
            if (!Object.values(users.ROLES).includes(role)) {
                throw new Error('Role is invalid');
            }

            updated_user.role = role;
        }
    }

    if (email !== undefined) {
        const clean_email = users.email_clean(email);

        if (!users.email_validate(clean_email)) {
            throw new Error('Email is not a valid email address');
        }

        if (users.email_exists(clean_email)) {
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
    users.save_users();
    return Object.keys(updated_user);
}

export function delete_user(id) {
    const user = users.admin_get_user(id);

    if (user == undefined) {
        throw new Error('User not found');
    } else if ( user.role == users.ROLES.ADMIN ) {
        throw new Error('Cannot delete admin user');
    }

    users.logout(user.id);
    user.status = users.STATUS.DELETED;
    users.save_users();
}

export function message_all_users(text, from_id) {
    const message_text = text?.trim();

    if (!message_text) {
        throw new Error('Message is empty');
    }

    users.get_users().forEach(user => {
        if ( user.role != users.ROLES.ADMIN ) {
            users.message_user(user.id, message_text, from_id, false)
        }
    });
    
    users.save_users();
}