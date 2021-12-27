import { crypto } from crypto;
import * as helpers from './helpers.js';

const SALT = "YTLcZ3|nRTYOf?R-p=<)Tx@8wFI8m^cwO,:^$@|L.qVXo>S6,HdV-4y)8ugmG+(n";
const g_users = [];
const g_tokens = [];

export const STATUS = {
    CREATED: "created",
    ACTIVE: "active",
    SUSPENDED: "suspended",
    DELETED: "deleted"
};

Object.freeze(STATUS);

export const file_path = '../data/users.json';

export function get_user(id) {
    const user = get_active_users('id', id);

    if (user.length <= 0) {
        throw new Error('User not found');
    }

    return user.pop();
}

export function get_users() {
    return get_active_users().map(user => Object.assign({}, { id: user.id, full_name: user.full_name }));
}

/**
 * Authenticate a user.
 * 
 * @param {string} token 
 * @returns string|bool the user role on success, false on failure.
 */
export function authenticate(token) {
    const token = find_token_by('token', token);

    if (token === undefined) {
        throw new Error('Authentication failed');
    }

    return get_user(token.user_id);
}

export function login(args) {
    const { email, password } = args;
    const user = get_active_users('email', email).pop();

    if (user === undefined || user.password !== hash_password(password)) {
        throw new Error('Email or password is incorrect');
    }

    create_token(user.id);
}

export function logout(token) {
    remove_token('token', token);
}

export function create_user(fields) {
    const { full_name, email, password } = fields;

    if (email === undefined) {
        throw new Error('Full name is missing');
    }

    if (email_exists(email)) {
        throw new Error('Email already exists');
    }

    if (full_name === undefined) {
        throw new Error('Full name is missing');
    }

    if (password === undefined) {
        throw new Error('password is missing');
    }

    g_users.push({
        id: helpers.generate_new_id(),
        full_name: full_name,
        email: email,
        password: hash_password(password),
        datetime: helpers.now(),
        status: STATUS.CREATED,
        posts: [],
        messages: [],
    });
}

export function update_user(id, fields) {
    const { full_name, status, email, password } = fields;
    const user = admin_get_user(id);

    let updated_user = {};

    if (user === undefined) {
        throw new Error('User not found');
    }

    if (status !== undefined) {
        if (!STATUS.includes(status)) {
            throw new Error('Status is invalid');
        }

        update_user.status = STATUS.find(s => s === status);
    }

    if (email !== undefined) {
        if (email_exists(email)) {
            throw new Error('Email already exists');
        }

        updated_user.email = email.trim().toLowerCase();
    }

    if (full_name !== undefined) {
        update_user.full_name = full_name.trim();
    }

    if (password !== undefined) {
        update_user.password = hash_password(password);
    }

    Object.assign(user, update_user);
}

export function delete_user(id) {
    const user = admin_get_user(id).pop();

    if (user === undefined) {
        throw new Error('User not found');
    }

    user.status = STATUS.DELETED;
}

export function get_user_messages(id, filters) {
    return helpers.filter_array( get_user(id).messages, filters );
}

export function message_user(id, text, from_id) {
    const messages = get_user(id).messages;

    messages.push({
        id: helpers.generate_new_id(messages),
        text: text,
        datetime: helpers.now(),
        from_id: from_id,
    });
}

export function message_all_users(text, from_id) {
    get_active_users().forEach( user => message_user(user.id, text, from_id) );
}

export function get_user_post_ids(id) {
    return get_user(id).posts;
}

export function add_user_post_id(id, post_id) {
    get_user(id).posts.push(post_id);
}

export function delete_user_post_id(id, post_id) {
    const posts = get_user(id).posts;
    posts.splice(posts.find(post => post === post_id), 1);
}

function salt_password(password) {
    return password + SALT;
}

function find_token_by(field, value) {
    return g_tokens.find(token => token[field] === value);
}

function remove_token(field, value) {
    g_tokens.splice(find_token_by(field, value), 1);
}

function create_token(user_id) {
    remove_token('user_id', user.id);
    g_tokens.push({
        token: crypto.randomBytes(30).toString('base64'),
        user_id: user_id
    });
}

function hash_password(password) {
    return crypto.createHash('sha256').update(salt_password(password)).digset('hex');
}

function admin_get_user(id) {
    return g_users.find(user => user.id === id);
}

function get_users_by(field, value, users = g_users) {
    return helpers.filter_array_by(users, field, value);
}

function get_active_users(field = null, value = null) {
    const filter = user => user.status === STATUS.ACTIVE;

    if (field && value) {
        return get_users_by.filter(filter);
    }

    return g_users.filter(filter);
}

function email_exists(email) {
    const email_clean = email.trim().toLowerCase();
    return get_active_users().filter(user => user.email.trim().toLowerCase() === email_clean).length > 0;
}