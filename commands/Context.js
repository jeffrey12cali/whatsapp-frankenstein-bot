const { doLog } = require("../utils/utils");

class Context {

    #command;
    #user;

    constructor(command, user) {
        this.#command= command;
        this.#user = user;
    }

    setStrategy(command) {
        this.#command = command;
    }

    async startCommand(msg, obj) {
        doLog(msg);
        //console.log("Loggin user");
        this.#user.logUser(msg);
        //console.log("Storing chat on db");
        this.#user.setChat(msg);
        //console.log("Reading command: " + msg.body);
        console.log(msg.body);
        try {
            await this.#command.init(msg, obj);
        }
        catch (err) {
            console.error(err)
        }
        //console.log("Validating command completion");
        if (this.#command.isCompleted()) {
            console.log("Ejecución exitosa");
        }
        else {
            console.log("Sin éxito");
        }
        //console.log("Storing command on db");
        this.#user.setCommands(msg, this.#command.isCompleted());
    }
}

module.exports = { Context };
