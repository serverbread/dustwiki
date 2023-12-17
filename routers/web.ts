'use strict';

import express, { Router } from 'express';
import log4js from 'log4js';
import fs from 'fs';

const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const router: Router = express.Router();

/*
router.get('/', (req, res) => {
    res.redirect(301, '/Mainpage');
    return;
});
*/
router.get('/editor/*', (req, res) => {
    const universe = fs.readFileSync('resources/web/universe.html').toString();
    const responseData = universe.replace(
        '%REPLACE_HERE%',
        fs.readFileSync('resources/web/editor.html').toString(),
    );
    res.end(responseData);
    return;
});

router.use((req, res, next) => {
    const path: string = decodeURIComponent(req.url)
        .split('?')[0]
        .replace('/', '');

    logger.debug(path);
    //if (path.) {

    //}
    const universe = fs.readFileSync('resources/web/universe.html').toString();
    const responseData = universe.replace(
        '%REPLACE_HERE%',
        fs.readFileSync('resources/web/viewer.html').toString(),
    );
    res.end(responseData);
    next();
});

module.exports = router;
