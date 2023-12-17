import YAML from 'yaml';
import fs from 'node:fs';
import sqlite3, { Database } from 'sqlite3';
import log4js from 'log4js';

const logger = log4js.getLogger();
logger.level = 'debug';

module.exports = async function init() {
    console.time('初始化');
    // data dir
    if (!fs.existsSync('data')) {
        logger.warn('data文件夹不存在...');
        fs.mkdirSync('data');
        logger.log('data文件夹已创建');
        console.timeLog('初始化');
    }
    // user data dir
    if (!fs.existsSync('data/user')) {
        logger.warn('data/user文件夹不存在...');
        fs.mkdirSync('data/user');
        logger.log('data/user文件夹已创建');
        console.timeLog('初始化');
    }
    // templates dir
    if (!fs.existsSync('templates')) {
        logger.warn('templates文件夹不存在...');
        fs.mkdirSync('templates');
        logger.log('templates文件夹已创建');
        console.timeLog('初始化');
    }
    // blacklist
    if (!fs.existsSync('./blacklist.json')) {
        logger.warn('ip黑名单不存在...');
        let defaultBlacklist: string[] = [];
        let defaultBlacklistJson: any = {
            ips: defaultBlacklist,
        };
        fs.writeFileSync(
            './blacklist.json',
            JSON.stringify(defaultBlacklistJson),
        );
        logger.log('ip黑名单已创建');
        console.timeLog('初始化');
    }
    // config
    if (!fs.existsSync('./config.yml')) {
        logger.warn('配置文件不存在...');
        const defaultConfig: Object = {
            server: {
                host: '0.0.0.0',
                port: 80,
                https: {
                    port: 443,
                    cert: {
                        cert: './localhost+1.pem',
                        key: './localhost+1-key.pem',
                    },
                },
            },
            email: {
                smtpHost: 'localhost',
                secure: true,
                smtpPort: 465,
                user: 'admin',
                pass: 'admin',
                send: {
                    from: '"验证你的SBWiki账号" <example@example.ex>',
                    subject: 'WELCOME',
                },
            },
            user: {
                jwtkey: '114514',
                jwtTimeout: '24h',
            },
            watchdog: {
                enabled: true,
                limit: 10,
            },
        };
        fs.writeFileSync('./config.yml', YAML.stringify(defaultConfig));
        logger.log('已生成配置文件');
        console.timeLog('初始化');
    }
    // redirect
    if (!fs.existsSync('./routers/redirect.yml')) {
        logger.warn('重定向文件不存在...');
        let defaultRedirectJson: any = {
            '/': '/Mainpage',
            '/api': '/Docs/Api',
            '/api/': '/Docs/Api'
        };
        fs.writeFileSync(
            './routers/redirect.yml',
            YAML.stringify(defaultRedirectJson),
        );
        logger.log('已生成重定向文件');
        console.timeLog('初始化');
    }
    // broadcast
    if (!fs.existsSync('./data/broadcast.txt')) {
        logger.warn('公告信息不存在...');
        let defaultBroadcast: string = '默认的公告信息';
        fs.writeFileSync('./data/broadcast.txt', defaultBroadcast);
        logger.log('已生成公告信息');
        console.timeLog('初始化');
    }
    // database
    if (!fs.existsSync('./data/users.db')) {
        logger.warn('用户数据库不存在...');
        const db: Database = new sqlite3.Database('data/users.db');
        db.run(`CREATE TABLE users(
            uuid TEXT NOT NULL PRIMARY KEY,
            email TEXT NOT NULL,
            username TEXT NOT NULL,
            hashedPassword TEXT NOT NULL,
            verified BOOLEAN NOT NULL
        );`);
        logger.log('已创建用户数据库');
        console.timeLog('初始化');
    }

    //watchdog
    if (!fs.existsSync('./data/viewLog.json')) {
        logger.warn('访问日志不存在...');
        fs.writeFileSync('./data/viewLog.json', '{}');
        logger.log('访问日志已创建');
        console.timeLog('初始化');
    }
    console.timeEnd('初始化');
    logger.log('初始化完成！');
};
