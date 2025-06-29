const { MessageMedia } = require('whatsapp-web.js');
const { getMediaFormat, saveBase64, changeVideoSpeed } = require('../utils/media-utils');
const client_messages = require('../config/messages');
const { Base } = require('./Base');
const subProcess = require('child_process');

const VIDEO_OUTPUT = './video-output';

class Vid extends Base {

    help0 = "- !vid | Procesa videos del chat.\n";
    help1 = `_Comando_: *!vid*\n_Descripción_: Cambia la velocidad de un video.\n_Sintaxis_: !vid speed <velocidad>\n_Utilización_: Responde al video con el comando e indica la velocidad.\n_Ejemplo_: !vid speed 1.5`;

    async init(msg) {
        this.completed = false;
        const args = msg.body.split(' ');
        if (args.length >= 3 && args[1] === 'speed') {
            const speed = parseFloat(args[2]);
            if (isNaN(speed) || speed <= 0) {
                msg.reply(client_messages['vid_invalid_speed']);
                this.completed = true;
                return;
            }
            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                if (quoted.hasMedia) {
                    const media = await quoted.downloadMedia();
                    const extension = getMediaFormat(media.mimetype.split('/')[1].split(';')[0]);
                    if (extension !== 'mp4') {
                        msg.reply(client_messages['vid_media_not_valid']);
                        this.completed = true;
                        return;
                    }
                    const filename = msg.from + Date.now() + '.' + extension;
                    try {
                        await saveBase64(media.data, filename, VIDEO_OUTPUT);
                        const processed = await changeVideoSpeed(filename, VIDEO_OUTPUT, speed);
                        const vidMedia = MessageMedia.fromFilePath(`${VIDEO_OUTPUT}/${processed}`);
                        await msg.reply(vidMedia);
                        this.completed = true;
                        setTimeout(() => {
                            try {
                                subProcess.execSync(`rm ${VIDEO_OUTPUT}/${filename}`);
                                subProcess.execSync(`rm ${VIDEO_OUTPUT}/${processed}`);
                            } catch (err) {
                                console.error(err);
                            }
                        }, 100);
                    } catch (err) {
                        msg.reply(client_messages['recurrent_error_msg']);
                        console.error(err);
                    }
                } else {
                    msg.reply(client_messages['vid_no_media']);
                    this.completed = true;
                }
            } else {
                msg.reply(client_messages['vid_no_msg_replied']);
                this.completed = true;
            }
        } else {
            msg.reply(client_messages['vid_incorrect_syntax']);
            this.completed = true;
        }
    }
}

class Vid_Help extends Vid {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Vid, Vid_Help };
