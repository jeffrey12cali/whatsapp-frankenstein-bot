const { Base } = require('./Base');

class Everyone extends Base {

    help0 = "- !everyone | Menciona todos los usuarios de un grupo.\n";
    help1 =
`_Comando_: *!everyone*
_Descripción_: Menciona todos los usuarios de un grupo.
_Sintaxis_: !everyone
_Utilización_: Utiliza el comando.
_Ejemplo_: !everyone`;

    async init(msg, obj) {
        this.completed = false;
        const { client } = obj;
        let string = '';
        try {
            const chat = await msg.getChat();
            const participants = await chat.participants;
            for (let participant of participants) {
                string += `@${participant.id.user} `;
            }
            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                quoted.reply(string, msg.from, {mentions: participants.map( participant => participant.id._serialized)});
            }
            else {
                client.sendMessage(msg.from, string, {mentions: participants.map( participant => participant.id._serialized)});
            }
        }
        catch (err) {
            console.error(err);
        }
        this.completed = true;
    }
}

class Everyone_Help extends Everyone {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Everyone, Everyone_Help };
