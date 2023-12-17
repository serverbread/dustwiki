import express, { Router } from 'express';
import log4js from 'log4js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import sqlite3, { Database } from 'sqlite3';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
//import extendedTables from 'marked-extended-tables'
//import extendedLatex from 'marked-extended-latex'

const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const config: any = require('../config.ts');
//logger.debug(config);
const router: Router = express.Router();
const db: Database = new sqlite3.Database('data/users.db');

router.post('/login', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let data: any = {
        error: false,
    };

    const reqData: any = req.body;
    db.get(
        `SELECT * FROM users WHERE email == '${reqData.account}' OR username == '${reqData.account}'`,
        (err, r) => {
            const row: any = r;
            if (err) logger.error(err);
            if (!row) {
                data.error = true;
                data.msg = '用户名或密码错误！';
                logger.error('用户尝试登录，但是查无此人');
                res.status(403).end(JSON.stringify(data));
                return;
            }
            logger.info('用户数据找到，开始登录...');
            if (!row.verified) {
                data.error = true;
                data.msg = '尚未验证！';
                logger.error('用户尚未验证！');
                res.status(403).end(JSON.stringify(data));
                return;
            }
            if (
                row.hashedPassword !=
                crypto
                    .createHash('sha512')
                    .update(reqData.password)
                    .digest('base64')
            ) {
                data.error = true;
                data.msg = '用户名或密码错误！';
                logger.error(`用户的密码错误！`);
                res.status(403).end(JSON.stringify(data));
                return;
            }
            // jwt签名
            jwt.sign(
                { uuid: row.uuid },
                config.user.jwtKey,
                {
                    expiresIn: config.user.jwtTimeout,
                    // algorithm: 'RS256'
                },
                (err, token) => {
                    if (err) {
                        logger.error(err);
                        data.error = true;
                        data.msg = '意料之外的错误！';
                        res.status(500).end(JSON.stringify(data));
                        return;
                    }
                    data.msg = '登录成功';
                    logger.log(`JWT签名成功！${token}`);
                    data.token = token;
                    res.setHeader(
                        'Set-Cookie',
                        `jwt=${token}; SameSite=Strict`,
                    ); //设置cookie
                    res.end(JSON.stringify(data));
                    return;
                },
            );
        },
    );
});

router.post('/register', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let data: any = {
        error: false,
    };

    const reqData: any = req.body;
    if (!reqData.email || !reqData.username || !reqData.password) {
        data.error = true;
        data.msg = '数据不全，请检查';

        res.status(403).end(JSON.stringify(data));
        return;
    }
    if (!validator.isEmail(reqData.email)) {
        data.error = true;
        data.msg = '输入的不是一个有效的邮箱！';

        res.status(403).end(JSON.stringify(data));
        return;
    }
    if (!/^(?!_)(?!.*?_$)[a-zA-Z0-9_]{3,16}$/.test(reqData.username)) {
        data.error = true;
        data.msg = '用户名非法！';

        res.status(403).end(JSON.stringify(data));
        return;
    }
    // 查重
    db.get(
        `SELECT * FROM users WHERE email == '${reqData.email}' OR username == '${reqData.username}';`,
        (err, row) => {
            if (!row) {
                // 写入数据库
                const uuid: string = uuidv4();
                db.run(`INSERT INTO users (uuid, email, username, hashedPassword, verified)
                    VALUES ('${uuid}',
                    '${reqData.email}',
                    '${reqData.username}',
                    '${crypto
                        .createHash('sha512')
                        .update(reqData.password)
                        .digest('base64')}',
                    false);`);
                // 发送邮件
                nodemailer
                    .createTransport({
                        host: config.email.smtpHost,
                        port: config.email.smtpPort,
                        secure: config.email.secure,
                        auth: {
                            user: config.email.user,
                            pass: config.email.pass,
                        },
                    })
                    .sendMail({
                        from: config.email.send.from,
                        to: reqData.email,
                        subject: config.email.send.subject,
                        html: `<a href='https://${req.hostname}/captcha/${uuid}'>点此验证</a>`,
                    });
                data.msg = '注册成功！请验证账号！';
                //logger.debug(req.body);
                res.end(JSON.stringify(data));
            } else {
                data.error = true;
                data.msg = '用户名或邮箱已被占用！';
                res.end(JSON.stringify(data));
            }
        },
    );
});

router.get('/captcha/*', (req, res) => {
    const captchaCode: String = req.path.split('/captcha/')[1];
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    //logger.debug(captchaCode);
    db.get(`SELECT * FROM users WHERE uuid == '${captchaCode}'`, (err, row) => {
        if (err) logger.error(err);
        if (!row) {
            logger.error('用户尝试验证，但是并未查询到相关信息');
            res.status(403).end('验证失败！请寻求站点管理员');
            return;
        }
        db.run(
            `UPDATE users SET verified = true WHERE uuid == '${captchaCode}';`,
            err => {
                if (err) logger.error(err);
                logger.log('用户成功验证账号，跳转...');
                res.redirect('/Login');
                return;
            },
        );
    });
});

router.get('/logout', (req, res) => {
    //res.setHeader('Set-Cookie', `token=''`);
    res.clearCookie('jwt');
    res.redirect('/Account');
});

module.exports = router;
