const { Base } = require('./Base');

class Test extends Base{

    help0 = "- !test | Comando para testear el bot.\n";
    help1 =
`_Comando_: *!test*
_Descripción_: Texto de ejemplo para verificar si el bot se encuentra vivo.
_Sintaxis_: !test
_Utilización_: Escribir el comando.
_Ejemplo_: !test`;

    init(msg, obj) {
        this.completed = false;
        try {
            msg.reply('Callate. Callate. Callate la hijueputa jeta');
            this.completed = true;
        }
        catch (e) {
            console.log(e);
        }
    }
}

class Test_Help extends Test {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Test, Test_Help };
