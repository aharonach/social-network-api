import * as crypto from "crypto";
import * as helpers from './helpers.js';
import * as files from './files.js';

/** 
 * Constants used by the module
 */
const FILE_PATH = 'data/users.json';
const SALT = "YTLcZ3|nRTYOf?R-p=<)Tx@8wFI8m^cwO,:^$@|L.qVXo>S6,HdV-4y)8ugmG+(n";
const TOKEN_INTERVAL = 1000 * 60 * 10;
const ADMIN_USER = {
    full_name: "Admin",
    password: "admin",
    email: "admin@admin.com"
};

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

setInterval(clear_expired_tokens, TOKEN_INTERVAL);

export function load_users() {
    files.load(FILE_PATH)
        .then((data) => {
            const users = JSON.parse(data);
            g_users.length = 0;
            users.forEach(element => {
                g_users.push(element);
            });
            create_admin_user();
        });
}

export function save_users() {
    files.save(FILE_PATH, JSON.stringify(g_users)).catch(err => console.log(err));
}

export function admin_get_user(id) {
    return g_users.find(user => user.id == id);
}

export function admin_get_users() {
    return g_users;
}

export function get_user(id) {
    const active_users = get_active_users('id', id);

    if (active_users.length <= 0) {
        throw new Error('User not found');
    }

    return helpers.delete_keys(active_users.pop(), ['password']);
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

    if (find_token == undefined) {
        throw new Error('Authentication failed');
    }

    return get_user(find_token.user_id);
}

export function login(args) {
    const { email, password } = args;

    if (email == undefined) {
        throw new Error('Email is missing');
    }

    if (password == undefined) {
        throw new Error('Password is missing');
    }

    const user = admin_get_users().find( user => user.email == email );

    if (user == undefined || user.status == STATUS.DELETED || user.password !== hash_password(password)) {
        throw new Error('Email or password is incorrect');
    } else if ( user.status == STATUS.CREATED ) {
        throw new Error('User not yet approved by the admin');
    } else if ( user.status == STATUS.SUSPENDED ) {
        throw new Error('User has been suspended');
    }

    return create_token(user.id);
}

export function logout(token) {
    remove_token('token', token);
}

export function create_user(fields, role) {
    const { full_name, email, password } = fields;

    if (email == undefined) {
        throw new Error('Email is missing');
    }

    if (email_exists(email)) {
        throw new Error('Email already exists');
    }

    if (full_name == undefined) {
        throw new Error('Full name is missing');
    }

    if (password == undefined) {
        throw new Error('password is missing');
    }

    const status = role == ROLES.ADMIN ? STATUS.ACTIVE : STATUS.CREATED;

    g_users.push({
        id: helpers.generate_new_id(g_users),
        full_name: full_name,
        email: email,
        password: hash_password(password),
        datetime: helpers.now(),
        status: status,
        posts: [],
        messages: [],
        role: role,
    });

    save_users();
}

export function get_user_messages(id, filters) {
    return helpers.filter_array(get_user(id).messages, filters);
}

export function message_user(id, text, from_id) {
    const messages = get_user(id).messages,
        message_text = text?.trim();

    if (!message_text) {
        throw new Error('Message is empty');
    }

    messages.push({
        id: helpers.generate_new_id(messages),
        text: text,
        datetime: helpers.now(),
        from_id: from_id,
    });

    save_users();
}

export function get_user_post_ids(id) {
    return get_user(id).posts;
}

export function add_user_post_id(id, post_id) {
    get_user(id).posts.push(post_id);
}

export function delete_user_post_id(id, post_id) {
    const posts = get_user(id).posts;
    const index = posts.findIndex(post => post == post_id);

    if (index >= 0) {
        posts.splice(index, 1);
    }

    save_users();
}

function create_admin_user() {
    const admin_user = admin_get_users().find(user => user.role == ROLES.ADMIN);

    if (admin_user == undefined) {
        create_user(ADMIN_USER, users.ROLES.ADMIN);
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

    if (index >= 0) {
        g_tokens.splice(index, 1);
    }
}

function create_token(user_id) {
    remove_token('user_id', user_id);

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

function clear_expired_tokens() {
    const tokens_to_remove = [];

    g_tokens.forEach( token => {
        const date = new Date(token.expire);
        if ( Date.now() > date ) {
            tokens_to_remove.push(token);
        }
    });

    tokens_to_remove.forEach(token => {
        remove_token('token', token.token);
    });
}

function hash_password(password) {
    return crypto.createHash('sha256').update(salt_password(password)).digest('hex');
}

function get_users_by(field, value, users = g_users) {
    return helpers.filter_array_by(users, field, value);
}

function get_active_users(field = null, value = null) {
    const filter = user => user.status == STATUS.ACTIVE;

    if (field && value) {
        return get_users_by(field, value).filter(filter);
    }

    return g_users.filter(filter);
}

function get_registered_users(field = null, value = null) {
    const filter = user => [STATUS.ACTIVE, STATUS.CREATED, STATUS.SUSPENDED].includes(user.status);

    if (field && value) {
        return get_users_by(field, value).filter(filter);
    }

    return g_users.filter(filter);
}

function email_exists(email) {
    const email_clean = email.trim().toLowerCase();
    return helpers.find_array_by(get_registered_users(), 'email', email_clean) !== undefined;
}
