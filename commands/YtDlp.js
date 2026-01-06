const { MessageMedia } = require('whatsapp-web.js');
const { Base } = require('./Base');
const subProcess = require("child_process");
const fs = require('fs');
const path = require('path');
const md5 = require("md5");
const client_messages = require('../config/messages');

const MATCH_FILTER = '!is_live & duration < 600';
const MATCH_FILTER_CLI = `--match-filter "${MATCH_FILTER}"`;
const JS_RUNTIME_ARGS = ['--js-runtimes', 'node'];
const DOCKER_COOKIES_PATH = path.resolve('/app/config/cookies.txt');
const LOCAL_COOKIES_PATH = path.resolve(__dirname, '../config/cookies.txt');
const COOKIE_CANDIDATE_PATHS = [DOCKER_COOKIES_PATH, LOCAL_COOKIES_PATH];

const resolveCookiesPath = () => COOKIE_CANDIDATE_PATHS.find(candidate => fs.existsSync(candidate));

const getCookiesArgs = () => {
    const cookiesPath = resolveCookiesPath();
    return cookiesPath ? ['--cookies', cookiesPath] : [];
}

const getCookiesCliSegment = () => {
    const cookiesPath = resolveCookiesPath();
    return cookiesPath ? `--cookies "${cookiesPath}"` : '';
}

const buildCommonArgs = (applyFilters = false) => {
    const args = [
        ...JS_RUNTIME_ARGS,
        ...getCookiesArgs()
    ];
    if (applyFilters) {
        args.push('--match-filter', MATCH_FILTER);
    }
    return args;
}

const buildCommonCliSegment = (applyFilters = false) => {
    const segments = [
        `${JS_RUNTIME_ARGS[0]} ${JS_RUNTIME_ARGS[1]}`
    ];
    const cookiesSegment = getCookiesCliSegment();
    if (cookiesSegment) {
        segments.push(cookiesSegment);
    }
    if (applyFilters) {
        segments.push(MATCH_FILTER_CLI);
    }
    return segments.filter(Boolean).join(' ');
}

const searchFilteredVideoId = (query) => {
    return new Promise((resolve, reject) => {
        const args = [
            ...buildCommonArgs(false),
            `ytsearch1:${query}`,
            '--match-filter',
            MATCH_FILTER,
            '--print',
            'id',
            '--skip-download',
            '--no-warnings'
        ];
        subProcess.execFile('yt-dlp', args, (error, stdout, stderr) => {
            if (error) {
                const errOutput = stderr ? stderr.toString() : error.message;
                if (errOutput && (errOutput.includes('No video matches') || errOutput.includes('does not pass filter'))) {
                    return resolve(null);
                }
                return reject(error);
            }
            const id = stdout ? stdout.toString().trim().split('\n').filter(Boolean).pop() : null;
            resolve(id || null);
        });
    });
}

const sendMedia = async (url, id, msg, mode, options = {}) => {
    console.log(id);
    const {
        applyFilters = false,
        cleanupDelayMs = 100
    } = options;
    const commonSegment = buildCommonCliSegment(applyFilters);
    let command, media_folder, format;
    switch (mode) {
        case 'video':
            command = `yt-dlp ${commonSegment} -S "vcodec:h264,res:480,ext:mp4" -o "./video-output/${id}.mp4" ${url}`;
            media_folder = 'video-output';
            format = 'mp4';
            break;
        case 'audio':
            command = `yt-dlp ${commonSegment} --extract-audio --audio-format mp3 -o "./audio-output/${id}.mp3" ${url}`;
            media_folder = 'audio-output';
            format = 'mp3'
            break;
    }
    try {
        subProcess.exec(command, async (err, stdout, stderr) => {
            if (err) {
                const errorOutput = stderr ? stderr.toString() : err.message;
                if (applyFilters && errorOutput && errorOutput.includes('does not pass filter')) {
                    msg.reply(client_messages["ytdlp_long_video"]);
                }
                else {
                    msg.reply(client_messages["ytdlp_error"]);
                }
                console.error(errorOutput);
            }
            else {
                try {
                    const media = MessageMedia.fromFilePath(`./${media_folder}/${id}.${format}`);
                    if (msg.hasQuotedMsg) {
                        const quotedMsg = await msg.getQuotedMessage();
                        await quotedMsg.reply(media);
                    }
                    else {
                        await msg.reply(media);
                    }
                    setTimeout(() => {
                        try {
                            subProcess.execSync(`rm ${media_folder}/${id}.${format}`);
                        }
                        catch (err) {
                            console.error(err);
                            msg.reply(client_messages["ytdlp_error_removing_content"]);
                        }
                    }, cleanupDelayMs);
                }
                catch (err) {
                    msg.reply(client_messages["ytdlp_error_sending_content"]);
                    console.error(err);
                }
            }
        });
    }
    catch (err) {
        msg.reply(client_messages["ytdlp_error_downloading_media"]);
        console.error(err);
    }
}

const helpers = {
    searchFilteredVideoId,
    sendMedia
}

// Hay un error con el completed porque una parte del código es asíncrona y no alcanza a tomar el valor de completed en true.
class YtDlp extends Base {

    async init(msg, obj) {
        this.completed = false;
        let mode = obj.mode;
        let query = msg.body.substring(7);
        if (msg.hasQuotedMsg && msg.links.length == 0 && query.length == 0) {
            const qtMsg = await msg.getQuotedMessage();
            if (qtMsg.links.length > 0) {
                query = qtMsg.links[0].link;
                msg = qtMsg;
            }
            else {
                msg.reply(client_messages["ytdlp_no_links"]);
            }
        }
        if (query && query.length > 0) {
            let isYoutubeUrlTrad = query.includes('youtube.com/watch?v=');
            let isYoutubeUrlShort = query.includes('youtu.be/');
            let isYoutubeShortUrl = query.includes('youtube.com/shorts/');
            if (isYoutubeUrlTrad || isYoutubeUrlShort || isYoutubeShortUrl) {
                let id = null;
                if (isYoutubeUrlTrad) {
                    id = query.match(/=.*/gm).toString().substring(1);
                }
                else if (isYoutubeUrlShort) {
                    id = query.match(/.be\/.*\?/gm).toString().substring(4).slice(0, -1);
                }
                else if (isYoutubeShortUrl) {
                    try {
                        id = query.match(/\/shorts\/.*\?/gm).toString().substring(8).slice(0, -1);
                    }
                    catch {
                        id = query.match(/\/shorts\/.*/gm).toString().substring(8);
                    }
                }
                else {
                    msg.reply(client_messages["recurrent_error_msg"]);
                    this.completed = true;
                }
                helpers.sendMedia(query, id, msg, mode, { applyFilters: true });
                this.completed = true;
            }
            else if (query.match(/\S+\.[^()\d]+(?:\([^)]*\))*/) == null) {
                try {
                    const id = await helpers.searchFilteredVideoId(query);
                    if (id) {
                        helpers.sendMedia(`https://www.youtube.com/watch?v=${id}`, id, msg, mode, { applyFilters: true });
                        this.completed = true;
                    }
                    else {
                        msg.reply(client_messages["ytdlp_long_video"]);
                        this.completed = true;
                    }
                }
                catch (err) {
                    msg.reply(client_messages["ytdlp_error_finding_video"]);
                    console.error(err);
                }
            }
            else {
                try {
                    helpers.sendMedia(msg.links[0].link, md5(msg.links[0].link), msg, mode);
                    this.completed = true;
                }
                catch (err) {
                    msg.reply(client_messages["ytdlp_error_downloading_no_yt"]);
                    console.error(err);
                }
            }
        }
        else {
            msg.reply(client_messages["ytdlp_no_params"]);
        }
    }
}

module.exports = { YtDlp, helpers, MATCH_FILTER, MATCH_FILTER_CLI };
