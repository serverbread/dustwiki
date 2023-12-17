import YAML from 'yaml';
import fs from 'node:fs';

const config: Object = YAML.parse(fs.readFileSync('./config.yml').toString());

module.exports = config;