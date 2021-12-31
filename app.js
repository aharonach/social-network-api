import express, { json, urlencoded } from 'express';
import { load_posts } from './functions/posts.js';
import { load_users } from './functions/users.js';
import admin_router from './routes/admin.js';
import users_router from './routes/users.js';
import posts_router from './routes/posts.js';

const app = express();
let port = 2718;

// General app settings
app.use((req, res, next) => {
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	next();
});
app.use(json()); // to support JSON-encoded bodies
app.use(urlencoded({ extended: true })); // to support URL-encoded bodies

app.use('/api', admin_router);
app.use('/api', users_router);
app.use('/api', posts_router);

app.listen(port, () => {
	load_posts();
	load_users();
	console.log(`Listening on port ${port}...`);
});
