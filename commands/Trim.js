const { MessageMedia } = require("whatsapp-web.js");
const { getMediaFormat, saveBase64, trim } = require("../utils/media-utils");
const { Base } = require("./Base");
const subProcess = require("child_process");
const client_messages = require('../config/messages');

formats = ["video", "audio", "ptt"];
trim_path = "./trim";

class Trim extends Base {

    help0 = "- !trim | Recorta video o audio.\n";
    help1 =
`_Comando_: *!trim*
_Descripción_: Recorta video o audio.
_Sintaxis_: !trim 
_Utilización_: Responde al mensaje que contenga un video o un audio y añade el rango que quieres recortar del video. El rango puede ser en segundos o en formato HH:MM:SS.
_Ejemplo1_: !trim 12 34
_Ejemplo2_: !trim 00:00:12 00:00:34
`;

    async init(msg, obj) {
        this.completed = false;
        const start = msg.body.split(" ")[1];
        const end = msg.body.split(" ")[2];
        if (start && end) {
            if (msg.hasQuotedMsg) {
                const qmsg = await msg.getQuotedMessage();
                if (qmsg.hasMedia) {
                    const type = qmsg.type;
                    console.log(type);
                    if (formats.includes(type)) {
                        const media = await qmsg.downloadMedia();
                        const extension = getMediaFormat(media.mimetype.split("/")[1].split(";")[0])
                        console.log(media.mimetype);
                        const filename = await msg.from + Date.now() + "." + extension;
                        try {
                            await saveBase64(media.data, filename, trim_path);
                            const file = await trim(filename, trim_path, start, end);
                            const trim_media = MessageMedia.fromFilePath(trim_path + "/" + file);
                            await msg.reply(trim_media);
                            this.completed = true;
                            setTimeout(() => {
                                try {
                                    subProcess.execSync(`rm ${trim_path}/${filename}`);
                                    subProcess.execSync(`rm ${trim_path}/${"trim_"+filename}`);
                                }
                                catch (err) {
                                    console.error(err);
                                }
                            }, 100);
                        }
                        catch (err) {
                            msg.reply(client_messages["trim_not_completed"]);
                            console.error(err);
                        }
                    }
                    else {
                        msg.reply(client_messages["trim_media_not_valid"]);
                        this.completed = true;
                    }
                }
                else {
                    msg.reply(client_messages["trim_no_media"]);
                    this.completed = true;
                }
            }
            else {
                msg.reply(client_messages["trim_no_msg_replied"]);
                this.completed = true;
            }
        }
        else {
            msg.reply(client_messages["trim_incorrect_syntax"]);
            this.completed = true;
        }
    }
}

class Trim_Help extends Trim {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Trim, Trim_Help };
