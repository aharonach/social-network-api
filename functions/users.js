import * as crypto from "crypto";
import * as helpers from './helpers.js';

const file_path = '../data/users.json';
const SALT = "YTLcZ3|nRTYOf?R-p=<)Tx@8wFI8m^cwO,:^$@|L.qVXo>S6,HdV-4y)8ugmG+(n";

const g_users = [];
const g_tokens = [];

export const STATUS = {
    CREATED: "created",
    ACTIVE: "active",
    SUSPENDED: "suspended",
    DELETED: "deleted"
};

export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};

Object.freeze(STATUS);
Object.freeze(ROLES);

export function admin_get_user(id) {
    return g_users.find(user => user.id === id);
}

export function admin_get_users() {
    return g_users;
}

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
    const find_token = find_token_by('token', token);

    if (find_token === undefined) {
        throw new Error('Authentication failed');
    }

    return get_user(token.user_id);
}

export function login(args) {
    const { email, password } = args;

    if (email === undefined) {
        throw new Error('Email is missing');
    }

    if (password === undefined) {
        throw new Error('Password is missing');
    }

    const user = get_active_users('email', email).pop();

    if (user === undefined || user.password !== hash_password(password)) {
        throw new Error('Email or password is incorrect');
    }

    return create_token(user.id);
}

export function logout(token) {
    remove_token('token', token);
}

export function create_user(fields, role) {
    const { full_name, email, password } = fields;

    if (email === undefined) {
        throw new Error('Email is missing');
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
        id: helpers.generate_new_id(g_users),
        full_name: full_name,
        email: email,
        password: hash_password(password),
        datetime: helpers.now(),
        status: STATUS.CREATED,
        posts: [],
        messages: [],
        role: role,
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
    return Object.keys(updated_user);
}

export function delete_user(id) {
    const user = admin_get_user(id).pop();

    if (user === undefined) {
        throw new Error('User not found');
    }

    user.status = STATUS.DELETED;
}

export function get_user_messages(id, filters) {
    return helpers.filter_array(get_user(id).messages, filters);
}

export function message_user(id, text, from_id) {
    const messages = get_user(id).messages,
        message_text = text.trim();

    if (!message_text) {
        throw new Error('Message is empty');
    }

    messages.push({
        id: helpers.generate_new_id(messages),
        text: text,
        datetime: helpers.now(),
        from_id: from_id,
    });
}

export function message_all_users(text, from_id) {
    const message_text = text.trim();

    if (!message_text) {
        throw new Error('Message is empty');
    }

    get_active_users().forEach(user => message_user(user.id, message_text, from_id));
}

export function get_user_post_ids(id) {
    return get_user(id).posts;
}

export function add_user_post_id(id, post_id) {
    get_user(id).posts.push(post_id);
}

export function delete_user_post_id(id, post_id) {
    const posts = get_user(id).posts;
    const index = posts.findIndex(post => post === post_id);

    if (index >= 0) {
        posts.splice(index, 1);
    }
}

function salt_password(password) {
    return password + SALT;
}

function find_token_by(field, value) {
    return helpers.find_array_by(g_tokens, field, value);
}

function remove_token(field, value) {
    const index = helpers.find_array_index_by(g_tokens, field, value);

    if (index < 0) {
        throw new Error('Authentication failed')
    }

    g_tokens.splice(index, 1);
}

function create_token(user_id) {
    remove_token('user_id', user.id);

    const token = crypto.randomBytes(30).toString('base64'),
        expire = new Date();
    expire.setMinutes(expire.getMinutes() + 10);

    g_tokens.push({
        token: token,
        user_id: user_id,
        expire: expire,
    });

    return token;
}

function hash_password(password) {
    return crypto.createHash('sha256').update(salt_password(password)).digest('hex');
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

function get_registered_users(field = null, value = null) {
    const filter = user => [STATUS.ACTIVE, STATUS.CREATED, STATUS.SUSPENDED].includes(user.status);

    if (field && value) {
        return get_users_by.filter(filter);
    }

    return g_users.filter(filter);
}

function email_exists(email) {
    const email_clean = email.trim().toLowerCase();
    return helpers.find_array_by(get_registered_users(), 'email', email_clean) !== undefined;
}