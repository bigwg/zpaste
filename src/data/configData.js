const Datastore = require('nedb');
const path = require('path');
const {app} = require('electron');

const configDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/zpasteConfig.db'),
    autoload: true,
    onload(error) {
        if (error !== null) {
            console.log('data load error:', error)
        }
    }
});

function addConfig(config) {
    configDb.insert(config);
}

module.exports = {addConfig};
