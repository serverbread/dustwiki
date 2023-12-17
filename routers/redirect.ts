'use strict';

import express, { Router } from 'express';
import log4js from 'log4js';
import fs from 'fs';
import YAML from 'yaml';

const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const router: Router = express.Router();

router.use((req, res, next) => {
    if (req.method !== 'GET') {
        next();
        return;
    }
    const redirection: any = YAML.parse(
        fs.readFileSync('routers/redirect.yml').toString(),
    );
    const path: string = decodeURIComponent(req.url).split('?')[0];

    for (let i in redirection) {
        if (path === i) {
            res.redirect(redirection[i]);
            return;
        }
    }
    next();
    return;
});

module.exports = router;
