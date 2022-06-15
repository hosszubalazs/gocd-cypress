const fs = require('fs');
const http = require('http');

const host = 'localhost';
const port = 4200;
const html = fs.readFileSync(`${__dirname}/../src/fake-app.html`);

http.createServer()
	.on('request', (req, res) => {
		res.setHeader("Content-Type", "text/html");
		res.writeHead(200);
		res.end(html);
	})
	.listen(port, host, () => {
		console.log(`Fake development web server is running on http://${host}:${port} ...`);
	});
