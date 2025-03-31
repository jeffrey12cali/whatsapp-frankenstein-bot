const { Base } = require('./Base');

class Photo extends Base {

    help0 = "- !photo | Convierte stickers o videos en imágenes.\n";
    help1 =
`_Comando_: *!photo*
_Descripción_: Convierte stickers o videos en imágenes.
_Sintaxis_: !photo
_Utilización_: Responde al sticker o video que quieras convertir en imagen con el comando.
_Ejemplo_: !photo`;

    async init(msg) {
        this.completed = false;
        if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia) {
                const media = await quoted.downloadMedia();
                try {
                    msg.reply(media);
                    this.completed = true;
                }
                catch (err) {
                    msg.reply(err);
                }
            }
            else {
                msg.reply('Este tío es tonto');
                this.completed = true;
            }
        }
        else {
            msg.reply('Responde al video/sticker/gif con "!photo"');
            this.completed = true;
        }
    }
}

class Photo_Help extends Photo {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Photo, Photo_Help };
