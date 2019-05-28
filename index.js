// Based on:
// - https://gist.github.com/DavidMellul/e85e1c94a708a4fdf53a0cb77f630cb0
//
// as referenced by:
// - https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca

// Dependencies

const fs = require('fs');
const http = require('http');
const https = require('https');

const express = require('express');

const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

const app = express();

// Certificate
const privateKey = fs.readFileSync('./webcert/live/ccatesting.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./webcert/live/ccatesting.com/cert.pem', 'utf8');
const ca = fs.readFileSync('./localcert/server_cert.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
  requestCert: true,
  rejectUnauthorized: false
};

app.use(redirectToHTTPS());

app.use(express.static('static'));

// Based on sample code in:
// https://medium.com/@sevcsik/authentication-using-https-client-certificates-3c9d270e8326
app.get('/', (req, res) => {
  console.log('got request for /');
  res.send(
    `<a href="authenticate">Log in using client certificate</a>
-- thanks
`);
});

app.get('/authenticate', (req, res) => {
  console.log('got request for /authenticate');
  const cert = req.connection.getPeerCertificate();

  if (req.client.authorized) {
    return res.status(401).send(
      `Detected subject: ${cert.subject.CN} issuer: ${cert.issuer.CN} - authorized OK
-- thanks
`);
  }

  if (cert.subject) {
    return res.status(401).send(
      `Detected cert subject: ${cert.subject.CN} issuer: ${cert.issuer.CN} - not authenticated
-- thanks
`);
  }

  res.send(
    `NO CLIENT CERTIFICATE DETECTED
-- thanks
`);
});

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
  console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
  console.log('HTTPS Server running on port 443');
});
