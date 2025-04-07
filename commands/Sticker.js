const { Base } = require('./Base');
const client_messages = require('../config/messages');

class Sticker extends Base {

    help0 = "- !sticker | Convierte imágenes o videos en stickers.\n";
    help1 =
`_Comando_: *!sticker*
_Descripción_: Convierte imágenes o videos en stickers.
_Sintaxis_: !sticker
_Utilización_: Responde a la imagen o video con el comando.
_Ejemplo_: !sticker`;

    async init(msg, obj) {
        this.completed = false;
        if (msg.hasQuotedMsg) {
            let quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia) {
                quoted = await quoted.reload();
                const media = await quoted.downloadMedia();
                try {
                    msg.reply(media, msg.from, { sendMediaAsSticker: true });
                    this.completed = true;
                }
                catch (err) {
                    msg.reply(err);
                }
            }
            else {
                msg.reply(client_messages["recurrent_error_msg"]);
                this.completed = true;
            }
        }
        else {
            msg.reply(client_messages["sticker_validation"]);
            this.completed = true;
        }
    }
}

class Sticker_Help extends Sticker {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Sticker, Sticker_Help };
