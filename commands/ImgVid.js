const { MessageMedia } = require('whatsapp-web.js');
const { getMediaFormat, saveBase64, mergeImgAudio, isVerticalVideo } = require('../utils/media-utils');
const client_messages = require('../config/messages');
const { Base } = require('./Base');
const subProcess = require("child_process");

VIDEO_OUTPUT = "./video-output";
AUDIO_OUTPUT = "./audio-output";

class ImgVid extends Base {

    help0 = "- !imgvid | Crea un video a partir de un audio y una imagen.\n";
    help1 =
`_Comando_: *!imgvid*
_Descripción_: Crea un video a partir de un audio y una imagen.
_Sintaxis_: !imgvid
_Utilización_: Responde al audio con una imagen y en el mismo mensaje de la imagen escribe !imgvid.`;

    async init(msg) {
        this.completed = false;
        if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia && msg.hasMedia) {
                const img_media = await msg.downloadMedia();
                const aud_media = await quoted.downloadMedia();
                const img_extension = getMediaFormat(img_media.mimetype.split("/")[1].split(";")[0])
                const aud_extension = getMediaFormat(aud_media.mimetype.split("/")[1].split(";")[0])
                if (img_extension !== "jpeg" || (aud_extension !== "mp3" && aud_extension !== "ogg")) {
                    msg.reply(client_messages["imgvid_invalid_formats"]);
                    this.completed = true;
                }
                else {
                    const now = Date.now();
                    const img_filename = await msg.from + now + "." + img_extension;
                    const aud_filename = await msg.from + now + "." + aud_extension;
                    try {
                        msg.reply(client_messages["imgvid_processing"]);
                        await saveBase64(img_media.data, img_filename, VIDEO_OUTPUT);
                        const vertical = await isVerticalVideo(img_filename, VIDEO_OUTPUT);
                        await saveBase64(aud_media.data, aud_filename, AUDIO_OUTPUT);
                        const filename_proc = await mergeImgAudio(vertical, img_filename, aud_filename, VIDEO_OUTPUT, AUDIO_OUTPUT);
                        const mergedMedia = MessageMedia.fromFilePath(`./video-output/${filename_proc}`);
                        await msg.reply(mergedMedia);
                        this.completed = true;
                        setTimeout(() => {
                            try {
                                subProcess.execSync(`rm ${VIDEO_OUTPUT}/${img_filename}`);
                                subProcess.execSync(`rm ${AUDIO_OUTPUT}/${aud_filename}`);
                                subProcess.execSync(`rm ${VIDEO_OUTPUT}/${filename_proc}`);
                            }
                            catch (err) {
                                console.error(err);
                            }
                        }, 100);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
            else {
                msg.reply(client_messages["recurrent_error_msg"]);
                this.completed = true;
            }
        }
        else {
            msg.reply(client_messages["aud_response"]);
            this.completed = true;
        }
    }
}

class ImgVid_Help extends ImgVid {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { ImgVid, ImgVid_Help };
