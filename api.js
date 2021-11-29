const { Router } = require('express');

const { User } = require('./controllers');

const router = new Router();

User.controller.mount(router, '/user');

module.exports = router;
