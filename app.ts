'use strict';
const timerName = '启动完成！用时';
console.time(timerName); // 计时器
require('./init')(); // 初始化

import express, { Application } from 'express';
import spdy, { Server, ServerOptions } from 'spdy';
import http from 'node:http';
import log4js from 'log4js';
import fs from 'fs';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const config: any = require('./config');
logger.log(config);
//logger.debug(config);
const app: Application = express();
app.use(bodyParser.json());
app.use(cookieParser());
const packageInf = JSON.parse(fs.readFileSync('./package.json').toString());
const welcomeMsg: string = `
    ${fs.readFileSync('logo.txt')}
    @Author: ${packageInf.author}
    @Version: v${packageInf.version}
`;
// 🍞🍞🍞🍞🍞🍞🍞🍞🍞🍞
console.log(welcomeMsg);
// http自动跳转https
app.use((req, res, next) => {
    const token: string = req.cookies.jwt;
    const jwtKey: string = config.user.jwtKey;
    if (!req.ip) {
        res.status(403).end();
        return;
    }
    logger.log(`${req.ip} ${req.method} ${req.originalUrl}`);
    /*
    jwt.verify(token, jwtKey, (err: any, payload: any) => {
        if (err && token) logger.error(err);
        //logger.debug(payload);
        //if (payload) res.isLogin = true;
        logger.log(
            `${req.ip} |${payload ? payload.uuid : ''}| ${req.method} > ${
                req.url
            }`,
        );
    });
    */
    if (req.protocol !== 'https') {
        return res.redirect('https://' + req.hostname + req.url);
    }
    next();
});

if (config.watchdog.enabled) {
    app.use(require('./watchdog'));
}

// 路由放在这里
app.use(require('./routers/redirect'));
app.use(require('./routers/api'));
app.use(require('./routers/users'));
app.use(require('./routers/resources'));
app.use(require('./routers/web'));

async function bootstrap() {
    const options: ServerOptions = {
        // Private key
        key: fs.readFileSync(config.server.https.cert.key).toString(),

        cert: fs.readFileSync(config.server.https.cert.cert).toString(),

        // **optional** SPDY-specific options
        spdy: {
            protocols: ['spdy/3.1', 'h2', 'http/1.1'],
            plain: false,
            'x-forwarded-for': true,
            connection: {
                windowSize: 1024 * 1024, // Server's window size
                // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
                autoSpdy31: true,
            },
        },
    };
    const httpsServer: Server = spdy.createServer(options, app);
    const httpServer: any = http.createServer(app);
    httpsServer.listen(config.server.https.port, () => {
        logger.log('https服务器已启动！');
    });
    httpServer.listen(config.server.port, () => {
        logger.log('http服务器已启动！');
    });
    console.timeEnd(timerName);
    // TODO: 启动性能检测
    setInterval(require('./status'), 1000);
}

bootstrap();
