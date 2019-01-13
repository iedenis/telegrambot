const TelegramBot = require('node-telegram-bot-api');
var algorithmia = require("algorithmia");
const fs = require('fs');
let config;
if (moduleAvailable('./config.json')) {
  config = require('./config.json');
}
var client = algorithmia(process.env.ALG_TOKEN || config.ALG_TOKEN);
const Axios = require('axios');
const Path = require('path')
const token = (process.env.BOT_TOKEN || config.BOT_TOKEN);

const bot = new TelegramBot(token);
var file_to_save;
var save_file;
var chatId;
var nlp_directory = client.dir("data://ie_denis/nlp_directory")

bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

// function to check the /config.json existing
function moduleAvailable(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) { }
  return false;
}

function fileDownload(remote_file, callback) {
  //console.log('response is: ' + response)
  console.log('remote_file is: ' + remote_file)
  client.file(remote_file).exists(function (exists) {
    // Download contents of file as a string if it exists
    client.file(remote_file).get(function (err, data) {
      if (err) {
        console.log("Failed to download file.");
        console.log(err);
      } else {
        console.log("Successfully downloaded data.")
      }

      var input = data;
      bot.sendMessage(chatId, 'colorizing your photo . It will take about 30 sec.')
      client.algo("deeplearning/ColorfulImageColorization/1.1.13")
        .pipe(input)
        .then(function (response) {
          file_to_save = response.get().output;
          // saveFile(file_to_save);
          client.file(file_to_save).get(function (err, data) {
            if (err) console.log(err)
            else {
              save_file = Math.random().toString(36).substring(7) + '.png';
              fs.writeFileSync('./files/' + save_file, data);
              console.log('colorized photo saved')
              callback(save_file);
            }
          })
        });
    });
  });
}

function processFile(path, callback) {
  const image_name = path.split('/').pop();
  console.log('the image is: ' + image_name)
  var remote_file = 'data://ie_denis/nlp_directory/' + image_name;
  //console.log(path);
  client.file(remote_file).exists(function (exists) {
    // Check if file exists, if it doesn't create it
    if (exists == false) {
      nlp_directory.putFile(path, function (response) {
        if (response.error) {
          return console.log("Failed to upload file: " + response.error.message);
        }
        
        //console.log("File uploaded. " + JSON.stringify(response));
      });
    } else {
      console.log("Your file already exists.")
    }
    fileDownload( remote_file, callback);

  });
}


//Listening
bot.on('polling_error', error => console.log(error))


bot.on('message', (msg) => {
  var filePath;
   chatId = msg.chat.id;
  if (typeof msg.photo == 'undefined') {
    bot.sendMessage(chatId, "Hi, please upload your b&w photo!")
  }
  else {
    console.log('the type of the message is: '+typeof(msg))
    const photo = msg.photo;
    const fileId = photo[2].file_id;
    bot.downloadFile(fileId, __dirname + '/images/')
      .then(path => processFile(path, function (save_file) {
        var photo = __dirname + '/files/' + save_file
        bot.sendPhoto(chatId, photo, { caption: 'This is your colorized photo' })
      }))
      .catch(err => console.log(err));
  }
});
