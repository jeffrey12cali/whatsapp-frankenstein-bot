const { Base } = require('./Base');

class Blank extends Base {

    help0 = "";
    help1 =
`_Comando_: *!test*
_Sintaxis_: !test
_Utilización_: Escribir el comando.
_Descripción_: Texto de ejemplo para verificar si el bot se encuentra vivo.`;

    init(msg, obj) {
    }
}

module.exports = { Blank };
