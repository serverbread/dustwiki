'use strict';

import express, { Router } from 'express';
import log4js from 'log4js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { simpleGit, SimpleGit } from 'simple-git';

const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const config: any = require('./config');
const router: Router = express.Router();

router.use((req, res, next) => {
    const ip: string = req.ip as string;
    const path: string = decodeURIComponent(req.url)
        .split('?')[0]
        .replace('/', '');
    if (path.split('/')[0] !== 'api' || path.split('/')[1] !== 'content') {
        next();
        return;
    }
    //logger.debug(path.split('/'));

    let limitData: any = JSON.parse(
        fs.readFileSync('data/viewLog.json').toString(),
    );
    logger.debug(limitData[ip]);
    if (limitData[ip]) {
        const first = limitData[ip].first; // 用户在此期间（每1min）第一次访问的UNIX时间戳
        if (Math.floor(Date.now() / 1000) - first >= 60) {
            // 如果时间超过60s了就清除用户的记录
            delete limitData[ip];
            fs.writeFileSync('data/viewLog.json', JSON.stringify(limitData));
            next();
            return;
        }
        const times = limitData[ip].times; // 用户在此期间的总访问次数
        if (times >= config.watchdog.limit) {
            let data: any = {
                error: true,
            };
            data.msg = '404 Not Found';
            data.ext = 'md';
            data.content = fs.readFileSync('content/403.md').toString();
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.status(403).end(JSON.stringify(data));
            return;
        } else {
            limitData[ip].times = times + 1;
        }
        fs.writeFileSync('data/viewLog.json', JSON.stringify(limitData));
    } else {
        limitData[ip] = {
            first: Math.floor(Date.now() / 1000),
            times: 0,
        };
        fs.writeFileSync('data/viewLog.json', JSON.stringify(limitData));
    }
    next();
});

router.use((req, res, next) => {
    const blacklist: string[] = JSON.parse(
        fs.readFileSync('blacklist.json').toString(),
    ).ips;
    for (let i in blacklist) {
        if (req.ip === blacklist[i]) {
            res.status(403).end();
        }
    }
    next();
    return;
});

module.exports = router;
