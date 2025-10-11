const express = require('express');
const session = require('express-session');
const path = require('path');
const { Issuer, generators } = require('openid-client');

const app = express();

const redirectUri = 'https://d84l1y8p4kdic.cloudfront.net';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let client;

async function initializeClient() {
    try {
        const issuer = await Issuer.discover('https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_xuG1M6rYc');
        client = new issuer.Client({
            client_id: '17dfvdao2o2qbmbmmtmhhlqpfl',
            client_secret: process.env.COGNITO_CLIENT_SECRET || '<client secret>',
            redirect_uris: [redirectUri],
            response_types: ['code']
        });
    } catch (error) {
        console.error('Failed to initialize Cognito OpenID client:', error);
        throw error;
    }
}

initializeClient().catch(console.error);

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: false
}));

const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }
    next();
};

app.get('/', checkAuth, (req, res) => {
    res.render('home', {
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo
    });
});

app.get('/login', (req, res) => {
    if (!client) {
        return res.status(503).send('Authentication service is not ready.');
    }

    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        scope: 'phone openid email',
        state: state,
        nonce: nonce
    });

    res.redirect(authUrl);
});

function getPathFromURL(urlString) {
    try {
        const url = new URL(urlString);
        return url.pathname || '/';
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

const callbackPath = getPathFromURL(redirectUri);

if (!callbackPath) {
    throw new Error('Invalid redirect URI configured for the Cognito callback handler.');
}

app.get(callbackPath, async (req, res) => {
    if (!client) {
        return res.status(503).send('Authentication service is not ready.');
    }

    try {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            redirectUri,
            params,
            {
                nonce: req.session.nonce,
                state: req.session.state
            }
        );

        const userInfo = await client.userinfo(tokenSet.access_token);
        req.session.userInfo = userInfo;

        res.redirect('/');
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        const baseLogoutUrl = 'https://<user pool domain>/logout';
        const logoutUrl =
            `${baseLogoutUrl}?client_id=17dfvdao2o2qbmbmmtmhhlqpfl&logout_uri=${encodeURIComponent(redirectUri)}`;
        res.redirect(logoutUrl);
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
