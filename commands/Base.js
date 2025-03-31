class Base {
    help0 = "";
    help1 = "";
    completed = false;

    init(msg, obj) {
    }

    getHelp0() {
        return this.help0;
    }

    getHelp1() {
        return this.help1;
    }

    isCompleted() {
        return this.completed;
    }
}

module.exports = { Base };
