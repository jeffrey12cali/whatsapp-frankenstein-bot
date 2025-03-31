const { Base } = require('./Base');

class Help extends Base {

    help0 = "";
    help1 =
`_Comando_: *!test*
_Descripción_: Texto de ejemplo para verificar si el bot se encuentra vivo.
_Sintaxis_: !test
_Utilización_: Escribir el comando.`;

    init(msg, obj) {
        this.completed = false;
        msg.reply(obj.help_text);
        this.completed = true;
    }
}

module.exports = { Help };
