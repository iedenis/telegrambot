const express = require('express');
const bodyParser = require('body-parser');
const packageInfo = require('./package.json');
const bot = require('./bot');

const app = express();
app.use(bodyParser.json());

app.get('/', function (req, res) {
    console.log("GET")
    res.sendStatus(200);
});

var server = app.listen(process.env.PORT || 3000,  () => {
    console.log('Web server started');
});

/*app.post('/'+bot.token, (req, res)=>{
    console.log(req);
    res.sendStatus(200)
})*/

module.exports = (bot) => {
    app.post('/' + bot.token, (req, res) => {
        console.log('POST method')
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
};
