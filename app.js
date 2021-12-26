import express, { json, urlencoded } from 'express';
import { StatusCodes } from 'http-status-codes';

const app = express();
let port = 2751;

// General app settings
const set_content_type = function (req, res, next) {
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	next();
}

app.use(set_content_type);
app.use(json());  // to support JSON-encoded bodies
app.use(
	// to support URL-encoded bodies
	urlencoded({
		extended: true
	})
);

app.use('/api');

app.listen(port);