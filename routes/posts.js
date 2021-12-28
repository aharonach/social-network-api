import express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as posts from '../functions/posts.js';
import * as auth from './auth.js';
import * as helpers from './helpers.js';

const router = express.Router();

router.use('/posts', auth.user);

router.get('/posts', (req, res) => {
    const posts_arr = posts.get_posts(req.body);
    res.status(StatusCodes.OK);
    res.send(helpers.json(posts_arr));
});

function create_post(req, res) {
    try {
        posts.create_post(res.locals.user_id, req.body.text);
        res.status(StatusCodes.OK);
        res.send(helpers.json({ success: true }));
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
}

router.post('/posts', create_post);
router.put('/posts', create_post);

router.get('/posts/:id', (req, res) => {
    try {
        const post = posts.get_post(req.params.id);
        res.status(StatusCodes.OK);
        res.send(helpers.json(post));
    } catch(e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

router.delete('/posts/:id', (req, res) => {
    try {
        const posts_arr = users.get_user_post_ids(res.locals.user_id);
        if (posts_arr.includes(req.params.id)) {
            posts.delete_post(req.params.id);
            res.status(StatusCodes.OK);
            res.send(helpers.json({ success: true }));
        } else {
            throw new Error('No permission to delete post');
        }
    } catch (e) {
        let status_code = StatusCodes.NOT_FOUND;

        if ( e.message == 'No permission to delete post' ) {
            status_code = StatusCodes.UNAUTHORIZED;
        }

        helpers.handle_error(res, e, status_code);
    }
});

export default router;