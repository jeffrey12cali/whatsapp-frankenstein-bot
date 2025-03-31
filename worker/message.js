const { workerData } = require('worker_threads');

const commands = require('./commands');

const context = new commands.Context(workerData.command_obj.Test, workerData.user_model);

function runCommand(name, cmd_class, msg, parm_obj) {
    if (!workerData.command_obj[name]) {
        workerData.command_obj[name] = new cmd_class();
    }
    context.setStrategy(workerData.command_obj[name]);
    context.startCommand(msg, parm_obj);
}

if (workerData.msg.body === '!test') {
    runCommand("Test", commands.Test, workerData.msg, {});
}
else if (workerData.msg.body === '!test help') {
    runCommand("Test_Help", commands.Test_Help, workerData.msg, {});
}
else if (workerData.msg.body === '!help') {
    runCommand("Help", commands.Help, workerData.msg, {help_text: workerData.help_text});
}
else if (workerData.msg.body === '!ytaud help') {
    runCommand("Ytaud_Help", commands.Ytaud_Help, workerData.msg);
}
else if (workerData.msg.body.startsWith('!ytaud ')) {
    runCommand("Ytaud", commands.Ytaud, workerData.msg);
}
else if (workerData.msg.body === '!booru help') {
    runCommand("Booru_Help", commands.Booru_Help, workerData.msg);
}
else if (workerData.msg.body === '!booru list help') {
    runCommand("Booru_List_Help", commands.Booru_List_Help, workerData.msg);
}
else if (workerData.msg.body === '!booru list') {
    runCommand("Booru_List", commands.Booru_List, workerData.msg, {sfw_boorus: workerData.sfw_boorus, nsfw_boorus: workerData.nsfw_boorus});
}
else if (workerData.msg.body.startsWith('!booru ')) {
    runCommand("Booru", commands.Booru, workerData.msg);
}
else if (workerData.msg.body === '!chef help') {
    runCommand("Chef_Help", commands.Chef_Help, workerData.msg);
}
else if (workerData.msg.body.startsWith('!chef ')) {
    runCommand("Chef", commands.Chef, workerData.msg);
}
else if (workerData.msg.body === '!sticker help') {
    runCommand("Sticker_Help", commands.Sticker_Help, workerData.msg);
}
else if (workerData.msg.body === '!sticker') {
    runCommand("Sticker", commands.Sticker, workerData.msg);
}
else if (workerData.msg.body === '!photo help') {
    runCommand("Photo_Help", commands.Photo_Help, workerData.msg);
}
else if (workerData.msg.body === '!photo') {
    runCommand("Photo", commands.Photo, workerData.msg);
}
else if (workerData.msg.body === '!callate help') {
    runCommand("Callate_Help", commands.Callate_Help, workerData.msg);
}
else if (workerData.msg.body === '!callate') {
    runCommand("Callate", commands.Callate, workerData.msg);
}
else if (workerData.msg.body === '!israel help') {
    runCommand("Israel_Help", commands.Israel_Help, workerData.msg);
}
else if (workerData.msg.body === '!israel') {
    runCommand("Israel", commands.Israel, workerData.msg);
}
else if (workerData.msg.body === '!nomequemes help') {
    runCommand("NoMeQuemes_Help", commands.NoMeQuemes_Help, workerData.msg);
}
else if (workerData.msg.body === '!nomequemes') {
    runCommand("NoMeQuemes", commands.NoMeQuemes, workerData.msg);
}
else if (workerData.msg.body === '!paladmin help') {
    runCommand("PalAdmin_Help", commands.PalAdmin_Help, workerData.msg);
}
else if (workerData.msg.body.startsWith('!paladmin ')) {
    runCommand("PalAdmin", commands.PalAdmin, workerData.msg);
}
else if (workerData.msg.body.startsWith("!")) {
    runCommand("Blank", commands.Blank, workerData.msg);
}
