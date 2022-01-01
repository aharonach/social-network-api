import express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as posts from '../functions/posts.js';
import * as users from '../functions/users.js';
import * as auth from './auth.js';
import * as helpers from './helpers.js';

const router = express.Router();

router.use('/posts', auth.user);

router.get('/posts', (req, res) => {
    const posts_arr = posts.get_posts(req.body);
    helpers.handle_success(res, posts_arr);
});

function create_post(req, res) {
    try {
        const post_id = posts.create_post(res.locals.user_id, req.body.text);
        users.add_user_post_id(res.locals.user_id, post_id);
        helpers.handle_success(res, { success: true, post_id: post_id }, StatusCodes.CREATED);
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
}

router.post('/posts', create_post);
router.put('/posts', create_post);

router.get('/posts/:id', (req, res) => {
    try {
        const post = posts.get_post(req.params.id);
        helpers.handle_success(res, post);
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

router.delete('/posts/:id', (req, res) => {
    const error_message = 'No permission to delete post';

    try {
        const user_posts = users.get_user_post_ids(res.locals.user_id).map(post_id => parseInt(post_id));
        const post = posts.get_post(req.params.id);

        if (user_posts.includes(parseInt(post.id))) {
            posts.delete_post(post.id);
            helpers.handle_success(res);
        } else {
            throw new Error(error_message);
        }
    } catch (e) {
        const status_code = e.message == error_message ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND;
        helpers.handle_error(res, e, status_code);
    }
});

export default router;