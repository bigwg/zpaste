import Datastore from 'nedb';
import path from 'path';
const remote = window.require('electron').remote;

export default new Datastore({
  filename: path.join(remote.app.getPath('userData'), '/data.db'),
  autoload: true,
  onload(error) {
    if(error !== null){
      console.log('data load error:' + error)
    }
  }
});
