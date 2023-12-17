'use strict';

import express, { Router } from 'express';
import log4js from 'log4js';
import fs from 'fs';

const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const router: Router = express.Router();

/*
router.use((req, res, next) => {
    const path: String = decodeURIComponent(req.url).split('?')[0].replace('/','');

    logger.debug(`${path} ${fs.existsSync(`content/${path}`)}`);
    if (fs.existsSync(`content/${path}`)) {
        res.end(fs.readFileSync('resources/web/content-view.html'));
        return;
    }
    next();
})
*/
router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'max-age=3600');
    const path: string = decodeURIComponent(req.url)
        .split('?')[0]
        .replace('/', '');
    const fileName: any = path.split('/').slice(-1)[0];
    if (fs.existsSync(`${path}`)) {
        const contentType: any = JSON.parse(
            fs.readFileSync('contentType.json').toString(),
        );
        for (let i in contentType) {
            if (fileName.split('.').slice(-1)[0] === i) {
                //logger.debug(i + ': ' +contentType[i]);
                res.setHeader(
                    'Content-type',
                    `${contentType[i]}; charset=utf-8`,
                );
            }
        }
        res.end(fs.readFileSync(`${path}`));
        return;
    }
    next();
});

module.exports = router;
