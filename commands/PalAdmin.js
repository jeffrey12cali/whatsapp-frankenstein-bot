const { Base } = require('./Base');
const fs = require('node:fs');
const client_messages = require('../config/messages');

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
                msg.reply(client_messages["paladmin_msg_sent"]);
                this.completed = true;
            } catch (err) {
                msg.reply(client_messages["paladmin_not_sent"]);
                console.log(err);
            }
        }
        else {
            msg.reply(client_messages["paladmin_text_validation"]);
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
