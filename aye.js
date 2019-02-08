const Koa = require('koa');
const _ = require('koa-route');
const pug = require('pug');
const low = require('lowdb');
const argv = require('yargs').argv;
const { exec } = require('child_process');
const FileSync = require('lowdb/adapters/FileSync');

const app = new Koa();

const hostname = argv.host;
const port = argv.port;

const adapter = new FileSync('aye.json');
const db = low(adapter);

var commands = db.get('commands').value();

const cmd = {
    list: (ctx) => {
        ctx.body = pug.renderFile('templates/index.pug', {
            commands: commands
        });
    },

    execute: (ctx, command) => {
        console.log('executing: ' + command);
        var c = db.get('commands').find({slug: command}).value();
        if (c != undefined) {

            exec(c.shell, (error, stdout, stderr) => {
                if (error) {
                  console.error(`exec error: ${error}`);
                  return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                ctx.body = stdout;
              });
        }
    }
}

// logger
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});

app.use(_.get('/', cmd.list));
app.use(_.get('/:command', cmd.execute));

app.listen(port);