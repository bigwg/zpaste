import $db from '../data';

function cacheLastUseInfo (obj = {}) {
    let cache = null, needUpdate = false;
    $db.find({ name: 'cache' }, (err, res) => {
      cache = res[0];
      if (obj.volume !== undefined) {
        cache.cacheValue.volume = obj.volume;
        needUpdate = true;
      }
      if (obj.playList && JSON.stringify(obj.playList) !== JSON.stringify(cache.cacheValue.playList)) {
        cache.cacheValue.playList = obj.playList;
        needUpdate = true;
      }
      if (obj.currentIndex !== undefined && obj.currentIndex !== cache.cacheValue.currentIndex) {
        cache.cacheValue.currentIndex = obj.currentIndex;
        needUpdate = true;
      }
      if (needUpdate) {
        $db.update({ name: 'cache' }, cache);
      }
    });
  }