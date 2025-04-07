const { Base } = require('./Base');
const { sendMedia } = require('../utils/utils');

class MediaSender extends Base {

    async init(msg, obj) {
        this.completed = false;
        const filename = msg.body.split(" ")[1];
        let file = obj.files.find((file) => file.includes(filename))
        if (file !== undefined)
            await sendMedia(msg, obj.base_path + '/' + file);
        else
            msg.reply()
        this.completed = true;
    }

    showTeque(teque) {
        let text = `_Archivos disponibles_:
`;
        for (const file of teque.files) {
            let text_file_prev = file.match(/.*\./g)[0]
            let text_file = text_file_prev.slice(0, text_file_prev.length-1);
            text += `- *${text_file}*
`;
        }
        return text;
    }
}

module.exports = { MediaSender };
