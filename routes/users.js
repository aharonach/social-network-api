import express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as users from '../functions/users.js';
import * as posts from '../functions/posts.js';
import * as auth from './auth.js';

const router = express.Router();

function get_user_posts(user_id, filters) {
    const post_ids = users.get_user_post_ids(user_id),
    posts_arr = posts.get_posts_by_id(post_ids, filters);
    return posts_arr.map( post => Object.assign({}, { id: post.id, text: post.text, datetime: post.datetime }));
}

// router.use(/users?\/(?!login|register).*/, auth_router);
router.use('/users?', auth.user);

router.post('/login', (req, res) => {
    try {
        const token = users.login(req.body);
        res.status(StatusCodes.OK);
        res.send(JSON.stringify({ token: token }));
    } catch (e) {
        res.status(StatusCodes.BAD_REQUEST);
        res.send(JSON.stringify({ error: e.message }));
    }
});

router.post('/logout', (req, res) => {
    try {
        users.logout(req.headers.token);
        res.status(StatusCodes.OK);
        res.send(JSON.stringify({ success: true }));
    } catch (e) {
        res.status(StatusCodes.BAD_REQUEST);
        res.send(JSON.stringify({ error: e.message }));
    }
});

function register(req, res) {
    try {
        users.create_user(req.body, users.ROLES.USER);
        res.status(StatusCodes.OK);
        res.send(JSON.stringify({ success: true }));
    } catch (e) {
        res.status(StatusCodes.BAD_REQUEST);
        res.send(JSON.stringify({
            success: false,
            error_message: e.message
        }));
    }
}

router.post('/register', register);
router.put('/register', register);

router.get('/user', (req, res) => {
    const user = users.authenticate(req.headers.token);
    res.status(StatusCodes.OK);
    res.send(JSON.stringify(user));
});

router.get('/users', (req, res) => {
    const users = users.get_users();
    res.status(StatusCodes.OK);
    res.send(JSON.stringify(users));
});

router.get('/user/messages', (req, res) => {
    try {
        const messages = users.get_user_messages(res.locals.user_id, req.body);
        res.status(StatusCodes.OK);
        res.send(JSON.stringify(messages));
    } catch(e) {
        res.status(StatusCodes.BAD_REQUEST);
        res.send(JSON.stringify({ error: e.message }));
    }
});

router.get('/user/posts', (req, res) => {
    try {
        const posts_arr = get_user_posts(res.locals.user_id, req.body);
        res.status(StatusCodes.OK);
        res.send(JSON.stringify(posts_arr));
    } catch(e) {
        res.status(StatusCodes.BAD_REQUEST);
        res.send(JSON.stringify({ error: e.message }));
    }
});

router.get('/user/:id', (req, res) => {
    try {
        const user = users.get_user( req.params.id );
        res.status(StatusCodes.OK);
        res.send(JSON.stringify({id: user.id, full_name: user.full_name }));
    } catch(e) {
        res.status(StatusCodes.NOT_FOUND);
        res.status(JSON.stringify({ error: e.message }));
    }
});

function message_user(req, res) {
    try {
        users.message_user( req.params.id, req.body.text );
        res.status(StatusCodes.OK);
        res.send(JSON.stringify({ success: true }))
    } catch (e) {
        res.status(StatusCodes.NOT_FOUND);
        res.status(JSON.stringify({ error: e.message }));
    }
}

router.post('/user/:id/message', message_user);
router.put('/user/:id/message', message_user);

router.get('/user/:id/posts', (req, res) => {
    try {
        const posts_arr = get_user_posts(req.params.id, req.body);
        res.status(StatusCodes.OK);
        res.send(JSON.stringify(posts_arr));
    } catch (e) {
        res.status(StatusCodes.NOT_FOUND);
        res.status(JSON.stringify({ error: e.message }));
    }
});

export default router;