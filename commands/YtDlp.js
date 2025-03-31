const { MessageMedia } = require('whatsapp-web.js');
const { Base } = require('./Base');
const youtubesearchapi = require("youtube-search-api");
const subProcess = require("child_process");
const md5 = require("md5");

const isTime1LongerThanTime2 = (time1, time2) => {
    const time1_list = time1.split(":");
    const time2_list = time2.split(":");

    if (time1_list.length > time2_list.length) {
        return true;
    }
    else if (time1_list.length < time2_list.length) {
        return false;
    }
    else if (time1_list.length = time2_list.length) {
        for (let i = 0; i < time1_list.length; i++) {
            if (time1_list[i] = time2_list[i]) {
                continue;
            }
            if (time1_list[i] > time2_list[i]) {
                return true;
            }
            else {
                return false
            }
        }
    }
}

const sendMedia = async (url, id, msg, mode) => {
    console.log(id);
    let command, media_folder, format;
    switch (mode) {
        case 'video':
            command = `yt-dlp -S "vcodec:h264,res:480,ext:mp4" -o "./video-output/${id}.mp4" ${url}`;
            media_folder = 'video-output';
            format = 'mp4';
            break;
        case 'audio':
            command = `yt-dlp --extract-audio --audio-format mp3 -o "./audio-output/${id}.mp3" ${url}`;
            media_folder = 'audio-output';
            format = 'mp3'
            break;
    }
    try {
        subProcess.exec(command, async (err, stdout, stderr) => {
            if (err) {
                msg.reply("Error al ejecutar el comando.");
                console.error(stderr);
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
                            msg.reply("Error al remover el contenido");
                        }
                    }, 100);
                }
                catch (err) {
                    msg.reply("Error al enviar el contenido.");
                    console.error(err);
                }
            }
        });
    }
    catch (err) {
        msg.reply("Error al descargar media.");
        console.error(err);
    }
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
                msg.reply("No se encontró ningún link.");
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
                    msg.reply("Este tío es tonto");
                    this.completed = true;
                }
                try {
                    console.log(id);
                    const res = await youtubesearchapi.GetVideoDetails(id);
                    // Need to modify youtube-search-api to give information about video length
                    if (res && isYoutubeShortUrl || res && !res.isLive) {
                        sendMedia(query, id, msg, mode);
                        this.completed = true;
                    }
                    else {
                        msg.reply("Video muy largo, prueba con otra búsqueda.");
                        this.completed = true;
                    }
                }
                catch (err) {
                    msg.reply("Error obteniendo detalles del video.");
                    console.error(err);
                }
            }
            else if (query.match(/\S+\.[^()\d]+(?:\([^)]*\))*/) == null) {
                try {
                    const res = await youtubesearchapi.GetListByKeyword(query, false, 5, [{type: "video"}]);
                    if (res && res.items.length > 0 && !res.items[0].isLive && !isTime1LongerThanTime2(res.items[0].length.simpleText, "10:00")) {
                        let id = res.items[0].id;
                        sendMedia(`https://www.youtube.com/watch?v=${id}`, id, msg, mode);
                        this.completed = true;
                    }
                    else {
                        msg.reply("Video muy largo, prueba con otra búsqueda.");
                        this.completed = true;
                    }
                }
                catch (err) {
                    msg.reply("Error buscando el video.");
                    console.error(err);
                }
            }
            else {
                try {
                    sendMedia(msg.links[0].link, md5(msg.links[0].link), msg, mode);
                    this.completed = true;
                }
                catch (err) {
                    msg.reply("Error descargando link de No Youtube.");
                    console.error(err);
                }
            }
        }
        else {
            msg.reply("No se especificaron los parámetros del comando.");
        }
    }
}

module.exports = { YtDlp };
