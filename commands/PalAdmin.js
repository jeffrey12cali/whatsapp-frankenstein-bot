const { Base } = require('./Base');
const fs = require('node:fs');

class PalAdmin extends Base{

    help0 = "- !paladmin | Deja un mensaje al admin de Botsito.\n";
    help1 =
`_Comando_: *!paladmin*
_Descripción_: Deja un mensaje al admin de Botsito.
_Sintaxis_: !paladmin <texto>
_Utilización_: Utilizar el comando y a continuación el mensaje que quieres que el admin vea (solo texto).
_Ejemplo_: !paladmin pa cuando la sesión de gooning?`;

    async init(msg, obj) {
        this.completed = false;
        if (msg.type == 'chat') {
            try {
                const contact = await msg.getContact();
                const number = contact.number;
                const name = contact.pushname;
                const timestamp = msg.timestamp;
                const body = msg.body.split(" ").slice(1).join(" ");
                const date = new Date(timestamp * 1000);
                const line = `|${date.toString()}| ${name} (${number}): ${body}\n`;
                fs.writeFileSync('./texts/paladmin.txt', line, { flag: 'a' });
                msg.reply("El mensaje ha sido enviado.");
                this.completed = true;
            } catch (err) {
                msg.reply("El mensaje no ha podido ser enviado. Intenta de nuevo.");
                console.log(err);
            }
        }
        else {
            msg.reply("El admin únicamente puede leer texto.");
            this.completed = true;
        }
    }
}

class PalAdmin_Help extends PalAdmin {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { PalAdmin, PalAdmin_Help };
