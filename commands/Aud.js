const { MessageMedia } = require('whatsapp-web.js');
const { getMediaFormat, saveBase64, extractAudio } = require('../utils/media-utils');
const { Base } = require('./Base');
const subProcess = require("child_process")

VIDEO_OUTPUT = "./video-output";

class Aud extends Base {

    help0 = "- !aud | Extrae el audio de un video.\n";
    help1 =
`_Comando_: *!aud*
_Descripción_: Extrae el audio de un video.
_Sintaxis_: !aud
_Utilización_: Responde al video con el comando.
_Ejemplo_: !aud`;

    async init(msg) {
        this.completed = false;
        if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia) {
                const media = await quoted.downloadMedia();
                const extension = getMediaFormat(media.mimetype.split("/")[1].split(";")[0])
                if (extension !== "mp4") {
                    msg.reply('El mensaje al que responde no es un video.');
                    this.completed = true;
                }
                else {
                    const filename = await msg.from + Date.now() + "." + extension;
                    try {
                        await saveBase64(media.data, filename, VIDEO_OUTPUT);
                        const filename_proc = await extractAudio(filename, VIDEO_OUTPUT);
                        const audMedia = MessageMedia.fromFilePath(`./audio-output/${filename_proc}`);
                        await msg.reply(audMedia);
                        this.completed = true;
                        setTimeout(() => {
                            try {
                                subProcess.execSync(`rm ${VIDEO_OUTPUT}/${filename}`);
                                subProcess.execSync(`rm ./audio-output/${filename_proc}`);
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
                msg.reply('Este tío es tonto');
                this.completed = true;
            }
        }
        else {
            msg.reply('Responde al video con "!aud"');
            this.completed = true;
        }
    }
}

class Aud_Help extends Aud {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Aud, Aud_Help };
