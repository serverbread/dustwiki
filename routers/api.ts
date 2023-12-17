'use strict';

import express, { Router } from 'express';
import log4js from 'log4js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { simpleGit, SimpleGit } from 'simple-git';
import querystring from 'querystring';
import sqlite3, { Database } from 'sqlite3';
//import marked from "marked";
//import extendedTables from 'marked-extended-tables'
//import extendedLatex from 'marked-extended-latex'

const config: any = require('../config.ts');
const logger: log4js.Logger = log4js.getLogger();
logger.level = 'debug';
const router: Router = express.Router();
//marked.use(extendedTables());
const db: Database = new sqlite3.Database('./data/users.db');

router.get('/api/content/*', (req, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    let responseData: any = {
        error: false,
    };

    let path: string = decodeURIComponent(req.url).split('?')[0];
    let tmpFileName: string = path.split('/api/content/')[1];
    // 去除字符串最后可能出现的的/：👇
    let fileName: string =
        tmpFileName.length - 1 === tmpFileName.lastIndexOf('/')
            ? tmpFileName.slice(0, tmpFileName.length - 1)
            : tmpFileName; // wtf this name
    
    //let dir: any = fs.readdirSync('content');
    let tmpPath = 'content';
    for (let i in fileName.split('/')) {
        if (fileName.slice(fileName.length - 1) === fileName[i]) break;
        tmpPath += `/${fileName.split('/')[i]}`;
    }// 设置目录
    console.log(tmpPath);
    if (fs.existsSync(tmpPath)) {
        let dir: any = fs.readdirSync(tmpPath);
        console.log(dir);
        const inf: any = JSON.parse(
            fs.readFileSync(`${tmpPath}/content.json`).toString(),
        );
        const content: String = fs
            .readFileSync(`${tmpPath}/content.${inf.ext}`)
            .toString();
        //logger.debug(inf);
        responseData.ext = inf.ext;
        responseData.content = content;
        //data.ext = dir[i].split('.').slice(-1)[0];
        //data.content = fs.readFileSync(`content/${dir[i]}`).toString();
        res.end(JSON.stringify(responseData));
        return;
    }
    
    /*
    for (let i in dir) {
        //logger.debug(dir[i]);
        if (dir[i].split(fileName).length === 2) {
            //logger.debug(`找到该页面：${dir[i]}`);
            if (fs.lstatSync(`content/${dir[i]}`).isFile()) {
                break;
            }
            const inf: any = JSON.parse(
                fs.readFileSync(`content/${dir[i]}/content.json`).toString(),
            );
            const content: String = fs
                .readFileSync(`content/${dir[i]}/content.${inf.ext}`)
                .toString();
            //logger.debug(inf);
            responseData.ext = inf.ext;
            responseData.content = content;
            //data.ext = dir[i].split('.').slice(-1)[0];
            //data.content = fs.readFileSync(`content/${dir[i]}`).toString();
            res.end(JSON.stringify(responseData));
            return;
        }
    }
    */
    /*
    if (fs.existsSync(`content/${fileName}`)) {
        data.ext = 'html';
        data.content = marked.parse(fs.readFileSync(`content/${fileName}`).toString());
        res.end(JSON.stringify(data));
        return;
    }
    */
    responseData.error = true;
    responseData.msg = '404 Not Found';
    responseData.ext = 'md';
    responseData.content = fs.readFileSync('content/404.md').toString();
    res.status(404).end(JSON.stringify(responseData));
    return;
});

router.get('/api/coffee*', (req, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    let responseData: any = {
        error: false,
    };
    responseData.msg = "I'm a teapot!";
    res.status(418).end(JSON.stringify(responseData));
    return;
});

router.get('/api/login-status', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset');
    let responseData: any = {
        error: false,
    };
    jwt.verify(
        req.cookies.jwt,
        config.user.jwtKey,
        (err: any, payload: any) => {
            if (err) {
                logger.error(err);
                responseData.error = true;
                responseData.msg = err.message;
                responseData.isLogin = false;
                res.status(500).end(JSON.stringify(responseData));
                return;
            }
            responseData.msg = '';
            responseData.isLogin = true;
            responseData.jwt = payload;
            res.end(JSON.stringify(responseData));
            return;
        },
    );
});

router.get('/api/broadcast', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let responseData: any = {
        error: false,
    };
    const broadcast: string = fs
        .readFileSync('./data/broadcast.txt')
        .toString();

    responseData.broadcast = broadcast;
    res.end(JSON.stringify(responseData));
});

router.get('/api/user/info', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let responseData: any = {
        error: false,
    };
    const arg: string = decodeURIComponent(req.url.split('?')[1]);

    const argv = querystring.parse(arg);
    if (!argv.UUID) {
        responseData.error = true;
        responseData.msg = '缺少UUID参数';
        res.status(403).end(JSON.stringify(responseData));
        return;
    }
    db.get(
        `SELECT * FROM users WHERE UUID='${argv.UUID}'`,
        (err: any, row: any) => {
            if (err) {
                logger.error(err);
                responseData.error = true;
                responseData.msg = err;
                res.status(500).end(JSON.stringify(responseData));
                return;
            }
            if (!row) {
                responseData.error = true;
                responseData.msg = '用户不存在';
                res.status(403).end(JSON.stringify(responseData));
                return;
            }
            // 删除多余信息
            let data: any = row;
            responseData.hashedPassword = void 0;
            responseData.verified = void 0;
            responseData.data = data;
            res.end(JSON.stringify(responseData));
            return;
        },
    );
});

router.post('/api/commit', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset');
    let responseData: any = {
        error: false,
    };
    const git: SimpleGit = simpleGit();
    const postData: object = req.body;
    jwt.verify(
        req.cookies.jwt,
        config.user.jwtKey,
        (err: any, payload: any) => {
            if (err) {
                logger.error(err);
                responseData.error = true;
                responseData.msg = err;
                res.status(403).end(JSON.stringify(responseData));
            }
            //logger.debug(payload);
        },
    );
    //logger.debug(postData);

    res.status(403).end(JSON.stringify(responseData));
});

router.get('/api/search', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let responseData: any = {
        error: false,
    };

    const arg: string = decodeURIComponent(req.url.split('?')[1]);
    const argv = querystring.parse(arg);
    if (!argv.keyword) {
        responseData.error = true;
        responseData.msg = '缺少keyword参数';
        res.end(JSON.stringify(responseData));
        return;
    }
    // 接下来从所有文章中搜索这个词
    // 先判断给的keyword参数是不是以'/'开头结尾，如果是的话使用正则搜索
    const dir = fs.readdirSync('content/');
    responseData.msg =
        '截取搜索到的关键词的以及其后20个字符';
    responseData.matches = {};

    for (let passageName in dir) {
        if (!fs.lstatSync(`content/${dir[passageName]}`).isFile()) {
            const ext: string = JSON.parse(
                fs
                    .readFileSync(`content/${dir[passageName]}/content.json`)
                    .toString(),
            ).ext;

            const content: string = fs
                .readFileSync(`content/${dir[passageName]}/content.${ext}`)
                .toString();

            const reg: RegExp = new RegExp(`${argv.keyword}`, 'g');
            // data.matches[dir[i]] = content.search(reg);
            // TODO: 以下需要重写
            const matches: string[] | null = content.match(reg);
            if (matches === null) continue;
            const matchesCount: number = matches.length;
            // TODO: 用indexOf()获取它们出现的位置;
            //  逻辑：
            //  在每个文章内搜索某个字符在索引第一次出现的位置，如果没有就跳出循环
            //  如果找到了，就继续从搜索到的字符串的后面开始再次搜索
            responseData.matches[dir[passageName]] = {
                resultCount: matchesCount,
                results: []
            };
            for (let matchResult in matches) {
                let currentPos: number = 0; // 此时字符串中记录的位置
                let noRepeatMatches: string[] = [];
                let tmp: any = {};
                // 此处去除matches中的冗余内容
                for (let i in matches) {
                    tmp[matches[i]] = '';
                }
                for (let i in tmp) {
                    noRepeatMatches.push(i);
                }
                //logger.debug(noRepeatMatches)
                while (
                    (content.indexOf(noRepeatMatches[matchResult], currentPos) !== -1)
                ) {
                    let index: number = content.indexOf(noRepeatMatches[matchResult], currentPos);
                    /*
                    logger.debug(
                        `在${dir[passageName]}的${index}找到了${
                            noRepeatMatches[matchResult]
                        }`,
                    );
                    */
                    responseData.matches[dir[passageName]].results.push({
                        pos: index,
                        content: content.slice(index, index + noRepeatMatches[matchResult].length + 50)
                    })
                    currentPos = index + matchResult.length;
                    //logger.debug(responseData.matches[dir[passageName]]);
                }
                //logger.debug(`结束循环后此时的状况：`);
                //logger.debug(responseData.matches[dir[passageName]]);
            }

        }
    }
    if (Object.keys(responseData.matches).length === 0) {
        responseData.error = true;
        responseData.msg = '没有找到匹配的关键词';
        res.status(404).end(JSON.stringify(responseData));
        return;
    }
    //logger.debug(responseData.matches)
    res.end(JSON.stringify(responseData));
    return;
});

router.get('/api/template/*', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let responseData: any = {
        error: false,
    };

    const templateName = decodeURIComponent(req.url).split('/api/template/')[1];
    if (!fs.existsSync(`templates/${templateName}`)) {
        responseData.error = true;
        responseData.msg = '模板不存在';
        res.status(403).end(JSON.stringify(responseData));
        return;
    }
    const templatePath = `templates/${templateName}`;

    const templateMeta: any = JSON.parse(
        fs.readFileSync(`${templatePath}/template.json`).toString(),
    );
    const ext: string = templateMeta.ext;
    const bind: string[] = templateMeta.bind;
    const templateContent: string = fs
        .readFileSync(`${templatePath}/template.${ext}`)
        .toString();
    responseData.ext = ext;
    responseData.bind = bind;
    responseData.content = templateContent;
    responseData.extend = {};
    responseData.extend.style = templateMeta.extends.style
        ? fs.readFileSync(`${templatePath}/template.css`).toString()
        : null;
    responseData.extend.script = templateMeta.extends.script
        ? fs.readFileSync(`${templatePath}/template.js`).toString()
        : null;
    res.end(JSON.stringify(responseData));
    return;
});

module.exports = router;
