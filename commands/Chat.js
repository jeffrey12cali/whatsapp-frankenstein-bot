const { Base } = require('./Base');
const client_messages = require('../config/messages');

const payload = {
    model: "mistral:7b-instruct",
    messages: [],
    stream: false
}

const HOST = "192.168.0.103";

class Chat extends Base {

    help0 = "- !chat | Chatea con el LLM de Botsito.\n";
    help1 =
`_Comando_: *!chat*
_Descripción_: Chatea con el LLM de Botsito.
_Sintaxis_: !chat
_Utilización_: Utiliza el comando al inicio del mensaje para chatear con Botsito.
_Ejemplo_: !chat`;

    async init(msg, obj) {
        this.completed = false;
        try {
            const {user_model} = obj;
            let body = msg.body.slice(6);
            const msg_hist = await user_model.getOllamaJson(msg);
            const mod_payload = {...payload}
            mod_payload.messages = msg_hist.messages;
            mod_payload.messages.push({role: "user", content: body});
            const response = await fetch(`http://${HOST}:11434/api/chat`, {
                method: "POST",
                body: JSON.stringify(mod_payload)
            }).catch((err) => {console.error(err); msg.reply(client_messages["chat_is_offline"])});;
            const res_json = await response.json();
            if (response.status == 200) {
                msg.reply(res_json.message.content);
                mod_payload.messages.push(res_json.message);
                await user_model.updateOllamaJson(msg, mod_payload.messages);
            }
            else {
                msg.reply(client_messages["chat_error_on_response"]);
            }
        }
        catch (err) {
            console.error(err);
        }
        this.completed = true;
    }
}

class Chat_Help extends Chat {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Chat, Chat_Help };
