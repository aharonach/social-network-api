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
    full_name: 'Admin',
    password: 'admin',
    email: 'admin@admin.com'
};

const g_users = [];
const g_tokens = [];

export const STATUS = {
    CREATED: 'created',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted'
};

export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};

Object.freeze(STATUS);
Object.freeze(ROLES);

/**
 * Interval which clears expired tokens.
 */
setInterval(clear_expired_tokens, TOKEN_INTERVAL);

/**
 * Load users from a file.
 */
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

/**
 * Save all users back to a file.
 */
export function save_users() {
    files.save(FILE_PATH, JSON.stringify(g_users)).catch(err => console.log(err));
}

/**
 * Get a user object with all it's properties.
 * 
 * @param {int} id 
 * @returns object - not deleted user.
 */
export function admin_get_user(id) {
    return g_users.find(user => user.id == id && user.status != STATUS.DELETED);
}

/**
 * Get all users.
 * 
 * @returns array of not deleted users
 */
export function admin_get_users() {
    return g_users.filter(user => user.status != STATUS.DELETED);
}

/**
 * Get a user object (without password property).
 * 
 * @param {int} id 
 * @returns object of user
 */
export function get_user(id) {
    const active_users = get_active_users('id', id);

    if (active_users.length <= 0) {
        throw new Error('User not found');
    }

    return helpers.delete_keys(active_users.pop(), ['password']);
}

/**
 * Get all users with only id and full_name properties.
 * 
 * @returns array users
 */
export function get_users() {
    return get_active_users().map(user => Object.assign({}, { id: user.id, full_name: user.full_name }));
}

/**
 * Authenticate a user.
 * 
 * @param {string} token 
 * @returns object object with user id and role.
 */
export function authenticate(token) {
    const find_token = find_token_by('token', token);

    if (find_token == undefined) {
        throw new Error('Authentication failed');
    }

    const the_user = get_user(find_token.user_id);

    return { id: the_user.id, role: the_user.role };
}

/**
 * Login a user.
 * 
 * @param {object} args 
 * @returns string a token for the logged-in user.
 */
export function login(args) {
    const { email, password } = args;

    if (email == undefined) {
        throw new Error('Email is missing');
    }

    if (password == undefined) {
        throw new Error('Password is missing');
    }

    const user = admin_get_users().find(user => user.email == email);

    if (user == undefined || user.status == STATUS.DELETED || user.password !== hash_password(password)) {
        throw new Error('Email or password is incorrect');
    } else if (user.status == STATUS.CREATED) {
        throw new Error('User not yet approved by the admin');
    } else if (user.status == STATUS.SUSPENDED) {
        throw new Error('User has been suspended');
    }

    return create_token(user.id);
}

/**
 * Logout a user.
 * 
 * @param {string} token
 */
export function logout(token) {
    if ( remove_token('token', token) < 0 ) {
        throw new Error('Invalid token');
    }
}

/**
 * Create a new user.
 * 
 * @param {object} fields 
 * @param {string} role 
 */
export function create_user(fields, role) {
    const { full_name, email, password } = fields;

    if (email == undefined) {
        throw new Error('Email is missing');
    }

    if (full_name == undefined) {
        throw new Error('Full name is missing');
    }

    if (password == undefined) {
        throw new Error('password is missing');
    }

    const clean_email = email_clean(email);

    if (!email_validate(clean_email)) {
        throw new Error('Email is not a valid email address');
    }

    if (email_exists(clean_email)) {
        throw new Error('Email already exists');
    }

    const status = role == ROLES.ADMIN ? STATUS.ACTIVE : STATUS.CREATED;

    g_users.push({
        id: helpers.generate_new_id(g_users),
        full_name: full_name,
        email: clean_email,
        password: hash_password(password),
        datetime: helpers.now(),
        status: status,
        posts: [],
        messages: [],
        role: role,
    });

    save_users();
}

/**
 * Get user's messages.
 * 
 * @param {int} id 
 * @param {object} filters 
 * @returns array of messages
 */
export function get_user_messages(id, filters) {
    return helpers.filter_array(get_user(id).messages, filters);
}

/**
 * Get a specific message of a specific user.
 * 
 * @param {int} id 
 * @param {int} message_id 
 * @returns object of a message.
 */
export function get_user_message(id, message_id) {
    const message = helpers.filter_array_by(get_user(id).messages, 'id', message_id).pop();

    if (message == undefined) {
        throw new Error('Message not found');
    }

    return message;
}

/**
 * Send a message to a user.
 * 
 * @param {int} id - user id 
 * @param {string} text - message text
 * @param {int} from_id - from user id
 * @param {bool} save - should save users after pushing the message
 */
export function message_user(id, text, from_id, save = true) {
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

    if ( save ) {
        save_users();
    }
}

/**
 * Get user's post ids.
 * 
 * @param {int} id - user ID 
 * @returns array of post IDs of the user
 */
export function get_user_post_ids(id) {
    return get_user(id).posts;
}

/**
 * Add a post ID in user's posts array.
 * 
 * @param {int} id - user ID
 * @param {int} post_id - post id to add
 */
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

export function email_clean(email) {
    return email.trim().toLowerCase();
}

export function email_exists(email) {
    return helpers.find_array_by(get_registered_users(), 'email', email) !== undefined;
}

export function email_validate(email) {
    return /^[^@\s]+@[^@\s\.]+\.[^@\.\s]+$/.test(email);
}

function create_admin_user() {
    const admin_user = admin_get_users().find(user => user.role == ROLES.ADMIN);

    if (admin_user == undefined) {
        create_user(ADMIN_USER, ROLES.ADMIN);
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

    return index;
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

    g_tokens.forEach(token => {
        const date = new Date(token.expire);
        if (Date.now() > date) {
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