import express, { json, urlencoded } from 'express';
import users_routers from './routes/users.js';

const app = express();
let port = 2718;

// General app settings
const set_content_type = function (req, res, next) {
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	next();
}

app.use(set_content_type);
app.use(json()); // to support JSON-encoded bodies
app.use(urlencoded({ extended: true })); // to support URL-encoded bodies

app.use('/api', users_routers);

app.listen(port, () => console.log("Start listening..."));