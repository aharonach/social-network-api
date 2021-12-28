import express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as users from '../functions/users.js';
import * as admin from '../functions/admin.js';
import * as posts from '../functions/posts.js';
import * as auth from './auth.js';
import * as helpers from './helpers.js';

const main_router = express.Router(),
    router = express.Router();

main_router.use('/admin', auth.admin);

router.get('/users', (req, res) => {
    const user_arr = admin.get_users(req.body);
    res.status(StatusCodes.OK);
    res.send(helpers.json(user_arr));
});

router.post('/users/:id', (req, res) => {
    try {
        const updated = admin.update_user(req.params.id, req.body);
        res.status(200);
        res.send(helpers.json({
            success: true,
            fields_updated: updated,
        }))
    } catch (e) {
        let status_code = StatusCodes.BAD_REQUEST;

        if ( e.message == 'User not found' ) {
            status_code = StatusCodes.NOT_FOUND;
        }

        helpers.handle_error(res, e, status_code);
    }
});

router.delete('/users/:id', (req, res) => {
    try {
        admin.delete_user(req.params.id);
        res.status(StatusCodes.OK);
        res.send(helpers.json({ success: true }));
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

router.delete('/posts/:id', (req, res) => {
    try {
        const user_id = posts.delete_post(req.params.id);
        users.delete_user_post_id(user_id, post_id);
        res.status(StatusCodes.OK);
        res.send({ success: true });
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.NOT_FOUND);
    }
});

function send_message(req, res) {
    try {
        admin.message_all_users(req.body.text, res.locals.user_id);
        res.status(StatusCodes.OK);
        res.send({ success: true });
    } catch (e) {
        helpers.handle_error(res, e, StatusCodes.BAD_REQUEST);
    }
}

router.post('/users/message', send_message);
router.put('/users/message', send_message);

main_router.use('/admin', router);

export default main_router;