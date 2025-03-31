const {getAuthorContact, validatePhoneNumber} = require("../utils/utils");
const {countryListAlpha3} = require('../static/js/countries');

class User {

    #pool;

    constructor(pool) {
        this.#pool = pool;
    }

    async getUser(num) {
        let conn;
        let rows = null;
        try {
            conn = await this.#pool.getConnection();
            rows = await conn.query(`SELECT * FROM USER WHERE num = '${num}'`);
        }
        catch (err) {
            console.log(err)
        }
        finally {
            if (conn) conn.end();
        }
        return rows;
    }

    async setUser(num, contact) {
        let conn;
        const num_info = validatePhoneNumber(num);
        if (num_info.isValid) {
            const name = contact.pushname;
            try {
                conn = await this.#pool.getConnection();
                const res = await conn.query("INSERT INTO USER (num, prefix, iso3, country, name) VALUE (?, ?, ?, ?, ?)", [num, num_info.countryCode.slice(1), num_info.countryIso3, countryListAlpha3[num_info.countryIso3], name]);
            }
            catch (err) {
                console.log(err)
            }
            finally {
                if (conn) return conn.end();
            }
        }
        else {
            console.log("Number not valid");
        }
    }

    async setCommands(msg, succ) {
        let conn;
        try {
            const contact = await msg.getContact();
            const chat = await msg.getChat();
            const num = contact.number;
            const comm = msg.body.split(" ")
            const command = comm[0];
            const args = comm.slice(1).join(" ");
            const chatId = chat.id.user;
            conn = await this.#pool.getConnection();
            const res = await conn.query("INSERT INTO COMMANDS (num, command, args, successful, chatId) VALUE (?, ?, ?, ?, ?)", [num, command, args, succ, chatId]);
        }
        catch (err) {
            console.log(err);
        }
        finally {
            if (conn) return conn.end();
        }
        
    }

    async setChat(msg) {
        let conn;
        try {
            const chat = await msg.getChat();
            const chatId = chat.id.user;
            const name = chat.name;
            const isGroup = chat.isGroup;
            conn = await this.#pool.getConnection();
            const res = await conn.query("INSERT INTO CHATS (chatId, name, isGroup) VALUE (?, ?, ?) ON DUPLICATE KEY UPDATE name=?, lastActive=current_timestamp()", [chatId, name, isGroup, name]);
        }
        catch (err) {
            console.log(err);
        }
        finally {
            if (conn) return conn.end();
        }
        
    }

    async logUser(msg) {
        const contact = await getAuthorContact(msg);
        const num = contact.number;
        const query_res = await this.getUser(num);
        if (query_res.length == 0) {
            this.setUser(num, contact)
        }
        else if (query_res.length == 1) {
        }
    }

    async getOllamaJson(msg) {
        let conn;
        let response;
        try {
            const chat = await msg.getChat();
            const chatId = chat.id.user;
            conn = await this.#pool.getConnection();
            const res = await conn.query("SELECT * FROM OLLAMA WHERE chatId = ?", [chatId]);
            console.log(res);
            if (res.length == 0) {
                const res1 = await conn.query("INSERT INTO OLLAMA (chatId, history) VALUE (?, ?)", [chatId, {messages: []}]);
                response = {messages: []};
            }
            else {
                console.log(res[0].history, typeof res[0].history);
                //let hist_mod = JSON.stringify(res[0].history).slice(1,-1).replaceAll('\\"', '"');
                //console.log(hist_mod);
                response = JSON.parse(res[0].history);
                console.log(response, typeof response);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) {
                conn.end();
                return response;
            }
        }
    }

    async updateOllamaJson(msg, msg_hist) {
        let conn;
        console.log(msg_hist);
        try {
            const chat = await msg.getChat();
            const chatId = chat.id.user;
            conn = await this.#pool.getConnection();
            console.log(`UPDATE OLLAMA SET history = '{"messages":${JSON.stringify(JSON.stringify(msg_hist)).replace(/'/g, "''").slice(1,-1)}}' WHERE chatId = ${chatId}`);
            const res = await conn.query(`UPDATE OLLAMA SET history = '{"messages":${JSON.stringify(JSON.stringify(msg_hist)).replace(/'/g, "''").slice(1,-1)}}' WHERE chatId = ?`, [chatId]);
            console.log(res);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) return conn.end();
        }
    }
}

module.exports = { User };
