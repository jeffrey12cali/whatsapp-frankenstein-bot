const { YtDlp } = require('./YtDlp');


// Hay un error con el completed porque una parte del código es asíncrona y no alcanza a tomar el valor de completed en true.
class YtAud extends YtDlp {

    help0 = "- !ytaud | Envía un audio con la búsqueda o el link ingresado.\n";
    help1 =
`_Comando_: *!ytaud*
_Descripción_: Envía un audio con la búsqueda o el link ingresado.
_Sintaxis_: !ytaud (<texto de búsqueda>|<link de YouTube>)
_Utilización_: Es posible ingresar un texto de búsqueda o un link a un video de YouTube.
_Ejemplo1_: !ytaud no me lo vaya a mandar muy puré
_Ejemplo2_: !ytaud https://www.youtube.com/watch?v=nJaWCKjy0RM`;

}

class YtAud_Help extends YtAud {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { YtAud, YtAud_Help };
