import express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as users from '../functions/users.js';
import * as posts from '../functions/posts.js';
import * as auth from './auth.js';
import * as helpers from './helpers.js';
import * as functions_helpers from '../functions/helpers.js';

const router = express.Router();

function get_user_posts(user_id, filters) {
    const post_ids = users.get_user_post_ids(user_id),
    posts_arr = posts.get_posts_by_id(post_ids, filters);
    return posts_arr.map( post => Object.assign({}, { id: post.id, text: post.text, datetime: post.datetime }));
}

router.use('/users?', auth.user);
router.use('/logout', auth.user);

router.post('/login', (req, res) => {
    try {
        const token = users.login(req.body);
        helpers.handle_success(res, { token: token });
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
});

router.post('/logout', (req, res) => {
    try {
        users.logout(res.locals.user_id);
        helpers.handle_success(res);
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
});

function register(req, res) {
    try {
        users.create_user(req.body, users.ROLES.USER);
        helpers.handle_success(res, { success: true }, StatusCodes.CREATED);
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
}

router.post('/register', register);
router.put('/register', register);

router.get('/user', (req, res) => {
    const user = functions_helpers.delete_keys( users.get_user(res.locals.user_id), ['messages', 'posts'] );
    helpers.handle_success(res, user);
});

router.get('/users', (req, res) => {
    const users_arr = users.get_users();
    helpers.handle_success(res, users_arr);
});

router.get('/user/messages', (req, res) => {
    try {
        const messages = users.get_user_messages(res.locals.user_id, req.body);
        helpers.handle_success(res, messages);
    } catch(e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
});

router.get('/user/messages/:id', (req, res) => {
    try {
        const message = users.get_user_message(res.locals.user_id, req.params.id);
        helpers.handle_success(res, message);
    } catch(e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

router.get('/user/posts', (req, res) => {
    try {
        const posts_arr = get_user_posts(res.locals.user_id, req.body);
        helpers.handle_success(res, posts_arr);
    } catch(e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
});

router.get('/user/:id', (req, res) => {
    try {
        const user = users.get_user( req.params.id );
        helpers.handle_success(res, { id: user.id, full_name: user.full_name });
    } catch(e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

function message_user(req, res) {
    try {
        users.message_user( req.params.id, req.body.text, res.locals.user_id );
        helpers.handle_success(res, { success: true }, StatusCodes.CREATED);
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
}

router.post('/user/:id/message', message_user);
router.put('/user/:id/message', message_user);

router.get('/user/:id/posts', (req, res) => {
    try {
        const posts_arr = get_user_posts(req.params.id, req.body);
        helpers.handle_success(res, posts_arr);
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

export default router;