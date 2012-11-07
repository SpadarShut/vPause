var oldAudioPlayer = window.audioPlayer || {};
var audioPlayer = {
  id: oldAudioPlayer.id || null,
  controls: oldAudioPlayer.controls || null,
  player: oldAudioPlayer.player || null,
  lastSong: oldAudioPlayer.lastSong || null,
  volW: 33,
  prX: 14,
  gpSz: 330,
  gpMinW: 154,
  gpMaxW: 553,
  images: {
    icon: '/images/favicon' + (vk.intnat ? '_vk' : 'new') + '.ico',
    playicon: '/images/playiconnew'+(window.devicePixelRatio >= 2 ? '_2x' : '')+'.ico',
    pauseicon: '/images/pauseiconnew'+(window.devicePixelRatio >= 2 ? '_2x' : '')+'.ico'
  },
  songInfos: {},
  initPlayer: function(id) {
    var _a = audioPlayer;
    var html5AudioSupport = false;
    try {
      var audioObj = ce('audio');
      if (('no' != audioObj.canPlayType('audio/mpeg')) && ('' != audioObj.canPlayType('audio/mpeg'))) html5AudioSupport=true;
    } catch (e){}
    if (browser.mobile || browser.msie6) _a.gpDisabled = true;
    if (browser.flash >= 9 && !(browser.mac && (browser.chrome || browser.safari) && html5AudioSupport)) {
      var opts = {
        url: '/swf/audio_lite.swf',
        id: 'player',
        height: 2
      }
      var params = {
        swliveconnect: 'true',
        allowscriptaccess: 'always',
        wmode: 'opaque'
      }
      var vars = {
        onLoadComplete: 'audioPlayer.onLoadComplete',
        onError: 'audioPlayer.onError',
        onPlayFinish: 'audioPlayer.onPlayFinish',
        onLoadProgress: 'audioPlayer.onLoadProgress',
        onPlayProgress: 'audioPlayer.onPlayProgress'
      }
      var t = 'flash_audio';
      if (!ge(t)) document.body.appendChild(ce('div',{id: t, className: 'fixed'}));
      if (renderFlash(t, opts, params, vars)) {
        setTimeout(function(){_a.checkFlashLoaded(id);},50);
      }
    } else {
      if (html5AudioSupport) {
        var t = 'html5_audio';
        if (!ge(t)) document.body.appendChild(ce('audio',{id: t}));
        stManager.add('audio_html5.js',function(){
          _a.isHTML5 = true;
          _a.setPlayer(audio_html5, id);
        });
      } else {
        _a.setPlayer(null,id);
      }
    }
    if (!_a.eventsInited) _a.initEvents();
    if (!ge('gp') && !_a.gpDisabled) {
      document.body.appendChild(ce('div', {id: 'gp', className: 'fixed'}));
      addEvent(ge('gp'), 'dragstart', function() {return false;});
      addEvent(ge('gp'), 'selectstart', function() {return false;});
      ge('gp').innerHTML = '<div class="wrap" onmouseover="addClass(this, \'over\');" onmouseout="removeClass(this, \'over\');">\
  <div id="gp_back"><div><!-- --></div></div>\
  <div id="gp_wrap">\
    <div class="audio" id="audio_global">\
      <div id="gp_small">\
        <div id="gp_play_btn" class="fl_l"></div>\
        <div id="gp_info" class="fl_l" onmouseover="Pads.preload(\'mus\')" onclick="window._pads.gpClicked = true; Pads.show(\'mus\', event)">\
          <div id="gp_performer"></div>\
          <div id="gp_title"></div>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>';
      toggle('gp', !_a.gpHidden && !cur.gpHidden);
      var headFixed = ge('head_play_btn') && getStyle(ge('page_header'), 'position') == 'fixed',
        gpTop = headFixed || scrollGetY() < 29 ? 49 : 20;
      setStyle(gp, {top: gpTop});
      // toggleClass(gp, 'z_index', !browser.mac);
    }
  },
  initEvents: function() {
    var _n = window.Notifier, _a = audioPlayer;
    if (_a.eventsInited) return;
    if (_n) {
      _n.addRecvClbk('audio_start', 'audio', function(data) {
        var _a = window.audioPlayer;
        if (_a) {
          if (_a.player && !_a.player.paused()) _a.pauseTrack();
          _a.pausedByVideo = null;
          if (window.Pads && window._pads && _pads.shown == 'mus') {
            Pads.hide();
          }
        }
      });
      _n.addRecvClbk('audio_mediakey', 'audio', this.keyPressed);
      _n.addRecvClbk('video_start', 'audio', function (data) {
        var _a = window.audioPlayer;
        if (_a && _a.player && !_a.player.paused()) {
          _a.pauseTrack();
          _a.pausedByVideo = 1;
        }
      });
      _n.addRecvClbk('video_hide', 'audio', function (data) {
        var _a = window.audioPlayer;
        if (_a) {
          if (_a.player && _a.player.paused() && _a.pausedByVideo) _a.playTrack();
          _a.pausedByVideo = null;
        }
      });
      _n.addRecvClbk('videocall_start', 'audio', function (data) {
        var _a = window.audioPlayer;
        if (_a && _a.player && !_a.player.paused()) {
          _a.pauseTrack();
          _a.pausedByVideo = 1;
        }
      });
      _n.addRecvClbk('videocall_end', 'audio', function (data) {
        var _a = window.audioPlayer;
        if (_a) {
          if (_a.player && _a.player.paused() && _a.pausedByVideo) _a.playTrack();
          _a.pausedByVideo = null;
        }
      });
    }
    addEvent(document, 'mouseup', _a.mouseUp);
    addEvent(document, 'mousemove', _a.mouseMove);
    addEvent(document, browser.opera ? 'keypress' : 'keydown', _a.keyPressed);
    _a.timeLeft = intval(getCookie('audio_time_left') || 1);
    if (cur.hashes && cur.hashes.add_hash && !_a.addHash) {
      _a.addHash = cur.hashes.add_hash;
    }

    _a.eventsInited = true;
  },
  checkFlashLoaded: function(id) {
    var player=ge("player");
    var _a=audioPlayer;
    if (player && player.paused) _a.setPlayer(player,id);
    else setTimeout(function(){_a.checkFlashLoaded(id);},50);
  },
  setPlayer: function(element, id) {
    if (element) {
      var _a = audioPlayer;
      _a.player = element;
      var volume = parseInt(getCookie('audio_vol'));
      if (!isNaN(volume)) _a.player.setVolume(volume / 100);
      _a.operate(id, true);
      if (!_a.gotData) {
        _a.gotData = -1;
        ajax.post('audio', {act: 'get_data'}, {
          onDone: function(hash, exp, langs) {
            window.lang = extend(window.lang || {}, langs);
            _a.addHash = hash;
            checkbox('currinfo_audio', (_a.statusExport = exp));
            if (exp) {
              _a.playback(_a.paused);
              _a.showCurrentTrack();
            }
            _a.gotData = 1;
          }
        })
      }
    } else {
      var message = getLang('audio_you_need_flash') + '<br/><br/>' + getLang('audio_do_you_want_flash');
      showFastBox({title: getLang('audio_need_flash_title')}, message, getLang('share_go'), function() {
        document.location = 'http://get.adobe.com/flash/';
      }, getLang('global_cancel'));
    }
  },
  setIcon: function(icon) {
    setFavIcon(audioPlayer.images[icon]);
  },
  getSongInfoFromDOM: function(aid) {
    var art, title, nfo = geByClass1('info', ge('audio' + aid)), full_id = aid, l;
    if (!nfo) {
      nfo = geByClass1('info', ge('audio' + aid + '_pad'));
    }
    art = geByTag1('b', nfo);
    l = geByTag1('a', art);
    if (l) art = l;
    var reArr = ['<span>', '</span>', '<span class="match">', '<font>', '</font>'], re = new RegExp(reArr.join('|'), "gi");
    art = art.innerHTML.replace(re, '');
    title = geByClass1('title', nfo);
    if (!title) title = ge('title' + aid);
    l = geByTag1('a', title);
    if (l) title = l.innerHTML;
    else title = title.innerHTML;
    title = title.replace(re, '');
    var data = ge('audio_info' + aid).value.split(','), url = data[0], duration = parseInt(data[1]);
    dur = audioPlayer.formatTime(duration);
    data = aid.split('_');
    var oid = data[0], aid = data[1], res = {
      0: oid,
      1: aid,
      2: url,
      3: duration,
      4: dur,
      5: art,
      6: title,
      7: 0,
      8: 0,
      9: oid != vk.id ? 1 : 0
    };
    res.full_id = full_id;
    return res;
  },
  setSongInfo: function() {
    var _a = audioPlayer, aid = currentAudioId(), pl;

    if ((pl = padAudioPlaylist()) && pl[aid]) {
      _a.lastSong = pl[aid];
    } else if (_a.songInfos[aid]) {
      _a.lastSong = _a.songInfos[aid];
    } else if (cur.defaultTrack && cur.defaultTrack.id == aid) {
      _a.lastSong = cur.defaultTrack;
    } else {
      _a.lastSong = _a.getSongInfoFromDOM(aid);
    }
    ls.set('pad_lastsong', _a.lastSong);
    _a.lastSong.aid = aid;
  },
  updateURL: function(full_id, audio_id, url, duration) {
    if (ge('audio_info'+full_id)) {
      ge('audio_info'+full_id).value = url+','+duration;
    }
    if (window.cur && cur.audios && cur.audios[audio_id]) {
      cur.audios[audio_id][2] = url;
      cur.audios[audio_id][3] = duration;
    }
    if (window.audioPlaylist && window.audioPlaylist[full_id]) {
      window.audioPlaylist[full_id][2] = url;
      window.audioPlaylist[full_id][3] = duration;
    }
    var pad_plist = ls.get('pad_playlist');
    if (pad_plist && pad_plist[full_id]) {
      this.setPadPlaylist(window.audioPlaylist);
    }
    if (window.cur && cur.nextPlaylist && cur.nextPlaylist[full_id]) {
      cur.nextPlaylist[full_id][2] = url;
      cur.nextPlaylist[full_id][3] = duration;
    }
  },
  reloadPlaylist: function() {
    if (window.cur && cur.audiosReloadedAll) return;
    if (window.audioPlaylist || window.cur && cur.audiosList && cur.audiosList['all'] && cur.oid) {
      var _a = audioPlayer;
      var query = {act: 'reload_playlist'};
      if (window.audioPlaylist) {
        var q = [];
        var i = 0, j = 0;
        for (var audio in window.audioPlaylist) {
          if (j >= 100) { j = 0; i++; }
          if (!q[i]) q[i] = [];
          q[i].push(audio);
          j++;
        }
        for (var i in q) {
          q[i] = q[i].join(',');
        }
        for (var i in q) {
          query['l['+i+']'] = q[i];
        }
      }
      if (window.cur && cur.audiosList && cur.audiosList['all'] && cur.oid) {
        query['oid'] = cur.oid;
      }
      ajax.post('audio', query, {onDone: function(list) {
        if (list) for (var i in list) {
          var a = list[i];
          var audio_id = i.split('_')[1];
          _a.updateURL(i, audio_id, a[0], a[1]);
        }
        if (!window.cur) window.cur = {};
        cur.audiosReloadedAll = true;
        setTimeout(function(){delete cur.audiosReloadedAll;}, 60000);
      }});
    }
  },
  reloadAudio: function(id) {
    ids = id.split('_');
    if (window.cur && (cur.audiosReloadedAll || cur.audiosReloaded && cur.audiosReloaded[id])) {
      setTimeout(showFastBox({title: getLang('global_error')}, getLang('audio_error_loading'), getLang('global_close')).hide, 2000);
    } else {
      ajax.post('audio', {act: 'reload_audio', owner_id: ids[0], audio_id: ids[1]}, {onDone: function(res) {
        if (res) {
          var _a = audioPlayer;
          _a.updateURL(id, ids[1], res[0], res[1]);
          _a.setSongInfo();
          _a.duration = res[1];
          _a.player.loadAudio(res[0]);
          _a.setControlsTitle();
          _a.setGraphics('load');
          _a.playback();
        }
        if (!window.cur) window.cur = {};
        if (!cur.audiosReloaded) cur.audiosReloaded = {};
        cur.audiosReloaded[id] = true;
        setTimeout(function(){delete cur.audiosReloaded[id];}, 60000);
      }});
    }
  },
  sendNotification: function(data) {
    var _n = window.Notifier;
    if (_n) _n.lcSend('audio_start', data);
    try {
      if (ge('video_player') && ge('video_player').playVideo) ge('video_player').playVideo(false);
    } catch(e) {}
  },
  setAid: function(aid) {
    audioPlayer.id = aid;
    ls.set('audio_id', aid);
  },
  operate: function(id, nextPlaylist, opts) {
    var _a = audioPlayer, aid = currentAudioId();

    if (opts && opts.songInfo) {
      _a.songInfos[id] = opts.songInfo;
    }
    if (!_a.player || (!ge('flash_audio') && !ge('html5_audio'))) {
      _a.initPlayer(id);
      return;
    }

    if (aid == id) {
      if (_a.player.paused()) {
        _a.sendNotification({id: id});
        if (_a.pausedByVideo) _a.pausedByVideo = null;
        if (_a.time != undefined) {
          try {_a.player.playAudio(_a.time)}catch(e){};
          _a.time = null;
        } else _a.player.playAudio();
        _a.setGraphics('play');
        _a.playback();
        if (!nextPlaylist) {
          if (ge('audio' + aid)) _a.scrollToTrack(aid);
        }
      } else {
        _a.player.pauseAudio();
        _a.setGraphics('pause');
        _a.playback(true);
      }
    } else {
      _a.sendNotification({id: id});
      if (_a.pausedByVideo) _a.pausedByVideo = null;
      if (aid) _a.stop();
      _a.setAid(id);
      if (window.padPlClicked) {
        var pList = _a.isPlaylistGlobal() ? ls.get('pad_playlist') || window.audioPlaylist : padAudioPlaylist();
        if (pList) {
          if (window.curNotifier && curNotifier.instance_id) {
            pList.instance = curNotifier.instance_id;
            _a.setPadPlaylist(pList);
          }
          nextPlaylist = !!pList[aid] && cur.nextPlaylist && cur.nextPlaylist[id];
        }
        delete window.padPlClicked;
      }
      if (nextPlaylist) {
        if (cur.curSection == 'popular' || cur.audioTop) {
          _a.top = true;
        } else {
          delete _a.top;
        }
        _a.setPlaybackParams();
        if (cur && cur.nextPlaylist && cur.nextPlaylist[id]) {
          window.audioPlaylist = clone(cur.nextPlaylist);
          if (!window.audioPlaylist.searchStr) {
            window.lastPlaylist = clone(window.audioPlaylist);
          }
          if (window._pads && _pads.shown == 'mus' && Pads.audioSearchStr) {
            window.audioPlaylist.searchStr = cur.nextPlaylist.searchStr = Pads.audioSearchStr;
            var pl = ge('pad_playlist');
            if (pl && window.sorter) {
              if (pl.sorter) {
                try {
                  each (pl.sorter.elems, function() {
                    setStyle(this, {top: 'auto', left: 'auto'});
                  });
                  pl.sorter.destroy();
                } catch(e) {}
              }
              sorter.init(pl, {onReorder: Pads.onAudioReorder, noMoveCursor: 1});
            }
          }
          audioPlaylist.address = nav.strLoc;
          cur.nextPlaylist = null;
        } else {
          if (!window.audioPlaylist || !window.audioPlaylist[id]) {
            if (ge('audio'+id)) {
              _a.createDynamicPlaylist(id, true);
              if (window._pads && _pads.shown == 'mus' && Pads.audioSearchStr) {
                window.audioPlaylist.searchStr = cur.nextPlaylist.searchStr = Pads.audioSearchStr;
              }
            } else if (window.audioPlaylist) {
              window.audioPlaylist = null;
            }
          }
        }
        _a.setPadPlaylist(window.audioPlaylist);
      }
      if (_a.lastSong == undefined || id != _a.lastSong.aid) _a.setSongInfo();
      var url = _a.lastSong[2];
      _a.duration = _a.lastSong[3];
      _a.player.loadAudio(url);
      _a.setControlsTitle();
      var ids = id.split('_');
      var uid = (ids && ids.length > 1) ? ids[0] : vk.id;
      if (intval(uid) == cur.audioFriend) {
        cur.audioFriendPlaying = cur.audioFriend;
        if (window.Audio) Audio.cacheFriendsList();
      }
      _a.setGraphics('load');
      updGlobalPlayer();
      _a.playback();
      if (cur.curSection == 'recommendations') {
        var el = ge('audio'+id);
        if (el && !el.nextSibling) {
          Audio.loadRecommendations();
        }
      }
    }
    if (_a.gpHidden) {
      _a.gpHidden = false;
      updGlobalPlayer();
    }
  },
  setGraphics: function(act) {
    var _a = audioPlayer, head_play = ge('head_play_btn'), aid = currentAudioId(),
      _row = ge('audio' +aid), pad_row = ge('audio'+aid+'_pad'), gp_play = ge('gp_play');
    if (!aid) return;
    switch (act) {
      case 'play':
        _a.setIcon('playicon');
        if (_row) {
          addClass(ge('play' + aid), 'playing');
          addClass(_row, 'current');
        }
        if (pad_row) {
          addClass(ge('play' + aid + '_pad'), 'playing');
          addClass(pad_row, 'current');
        }
        if (head_play) {
          addClass(head_play, 'playing');
        }
        if (gp_play) {
          addClass(gp_play, 'playing');
        }
        if (_a.controls) {
          for (var i in _a.controls) {
            var obj = _a.controls[i];
            if (obj.play) addClass(obj.play, 'playing');
          }
        }
        break;
      case 'pause':
        _a.setIcon('pauseicon');
        if (_row) {
          removeClass(ge('play' + aid), 'playing');
        }
        if (pad_row) {
          removeClass(ge('play' + aid + '_pad'), 'playing');
        }
        if (head_play) {
          removeClass(head_play, 'playing');
        }
        if (gp_play) {
          removeClass(gp_play, 'playing');
        }
        if (_a.controls) {
          for (var i in _a.controls) {
            var obj = _a.controls[i];
            if (obj.play) removeClass(obj.play, 'playing');
          }
        }
        break;
      case 'stop':
        _a.setIcon('icon');
        if (_row) {
          if (ge('repeat' + aid)) hide('repeat' + aid);
          removeClass(ge('play' + aid), 'playing');
          removeClass(_row, 'current');

          if (aid) {
            var t = _a.duration || _a.lastSong && _a.lastSong[3] || ge('audio_info' + aid).split(',')[1],
                res = _a.formatTime(t),
                dur = geByClass1('duration', ge('audio' + aid));
            if (dur && res) dur.innerHTML = res;
          }

        }
        if (pad_row) {
          removeClass(ge('play' + aid + '_pad'), 'playing');
          removeClass(pad_row, 'current');
        }
        if (head_play) {
          removeClass(head_play, 'playing');
        }
        if (gp_play) {
          removeClass(gp_play, 'playing');
        }
        if (_a.controls) {
          for (var i in _a.controls) {
            var obj = _a.controls[i];
            if (obj.play) removeClass(obj.play, 'playing');
          }
        }
        break;
      case 'load':
        var loaded = 0, playerVol = _a.player.getVolume(),
            vol = Math.round(_a.volW * playerVol);
        if (vk.rtl) vol = -vol;
        _a.setIcon('playicon');
        if (_a.controls) {
          for (var i in _a.controls) {
            var obj = _a.controls[i];
            if (obj.volume) {
              setStyle(obj.volume, {width: (playerVol * 100) + '%'})
            }
          }
        }
        if (_row) {
          addClass(ge('play' + aid), 'playing');
          addClass(_row, 'current');
          if (ge('player' + aid)) {
            if (ge('audio_vol_line' + aid)) {
              setStyle(ge('audio_vol_line' + aid), {width: (playerVol * 100) + '%'});
            }
          }
          var r = ge('repeat' + aid);
          if (r) {
            show(r);
            if (_a.repeat) {
              addClass(r, 'on');
            } else {
              removeClass(r, 'on');
            }
          }
        }
        var tabCurRow = geByClass1('tab_current', ge('pad_playlist'));
        if (tabCurRow) {
          removeClass(tabCurRow, 'tab_current');
        }
        if (pad_row) {
          addClass(ge('play' + aid + '_pad'), 'playing');
          addClass(pad_row, 'current');
        }
        if (head_play) {
          addClass(head_play, 'playing');
        }
        if (gp_play) {
          addClass(gp_play, 'playing');
        }
        if (_a.controls) {
          for (var i in _a.controls) {
            var obj = _a.controls[i];
            if (obj.play) addClass(obj.play, 'playing');
            if (obj.add && obj.container) {
              var mid = aid.split('_')[0];
              toggleClass(obj.container, 'add', mid != vk.id);
            }
          }
        }
        break;
    }
  },
  stop: function() {
    var _a = audioPlayer, aid = currentAudioId();
    if (aid) {
      if (_a.player) _a.player.stopAudio();
      _a.setGraphics('stop');
      _a.setAid(null);
    }
  },
  pauseTrack: function() {
    var _a = audioPlayer, aid = currentAudioId();
    if (aid && _a.player && !_a.player.paused()) {
      _a.operate(aid);
    }
  },
  playTrack: function() {
    var _a = audioPlayer, aid = currentAudioId();
    if (aid && _a.player && _a.player.paused()) {
      _a.operate(aid);
    }
  },
  setPlaybackParams: function() {
    var _a = audioPlayer, aid = currentAudioId(), ids = (aid || '').split('_'), params = {};
    if (cur.curSection == 'recommendations') params.recommendation = 1;
    if (nav.objLoc[0] == 'search' && nav.objLoc['c[section]'] == 'audio' && !nav.objLoc['c[q]']) params.top = 1;
    if (nav.objLoc[0] == 'audio' && nav.objLoc['act'] == 'popular' && !nav.objLoc['q']) params.top_audio = 1;
    if ((aid + '').match(/^-?\d+_\d+_s(\d+)$/) && window.audioPlaylist && audioPlaylist[aid]) params.status = 1;
    if (_a.isAudioFriend(ids[0], aid)) params.friend = ids[0];
    if ((cur.module == 'groups' || cur.module == 'public' || nav.objLoc[0] == 'audio') && cur.oid == ids[0] && cur.oid < 0) params.group = 1;
    if ((nav.objLoc[0] == 'audio' || nav.objLoc[0] == 'feed') && nav.objLoc['q'] || nav.objLoc[0] == 'search' && nav.objLoc['c[q]']) params.search = 1;
    if (nav.objLoc[0] == 'audio' && nav.objLoc['album_id'] && cur.album_id) params.album = 1;
    if (!params.search && nav.objLoc[0] == 'feed') params.feed = 1;
    _a.playbackParams = params;
  },
  isAudioFriend: function(oid, full_id) {
    return (oid != vk.id && cur.allAudiosIndex && cur.allAudiosIndex != 'all' && cur.audioFriend && cur.curSection != 'recommendations' && cur.curSection != 'popular') || ge('audio_playback'+full_id) || (cur.isAudioFriend && cur.curSection != 'recommendations' && cur.allAudiosIndex && cur.allAudiosIndex == 'all');
  },
  playbackSent: 0,
  statusSent: 0,
  playback: function(paused) {
    // if (nav.objLoc[0].substr(0, 6) == 'widget') return;
    var _a = audioPlayer, aid = currentAudioId(), ids = (aid || '').split('_');
    if (ids.length < 2 && cur.oid) { // edit mode
      ids = [cur.oid, aid];
      aid = ids.join('_');
    }
    if (_a.statusExport && ids[1] != _a.statusSent) {
      setTimeout(ajax.post.pbind('audio', {act: 'audio_status', full_id: aid, hash: _a.addHash}), 0);
      _a.statusSent = ids[1];
    }
    clearTimeout(_a.playbackTimer);
    if (!paused && aid && vk.id) {
      if (ids[1] != _a.playbackSent) {
        _a.playbackTimer = setTimeout(function() {
          var query = {act: 'playback', full_id: aid, hash: _a.addHash};
          if (ids[0] == vk.id && ids[1]) query.id = ids[1];
          if (_a.playbackParams) extend(query, _a.playbackParams);
          ajax.post('audio', query, {onDone: function() {
            _a.playbackSent = ids[1];
          }});
        }, 10000);
      }
    }
  },
  keyPressed: function(e) {
    e = normEvent(e);
    if (!e.keyCode) return;
    var keyCodes = [176, 177, 178, 179], inArr = false;
    each(keyCodes, function(k, v){
      if (e.keyCode == v) {
        inArr = true;
        return false;
      }
    });
    if (!inArr) return;
    var cn = window.curNotifier, pData = ls.get('pad_pldata'), anotherTab = cn && pData && cn.instance_id && pData.instance && cn.instance_id !== pData.instance;
    if (!e.noBroadcast) {
      if (anotherTab) {
        var _n = window.Notifier;
        if (_n) _n.lcSend('audio_mediakey', {keyCode: e.keyCode, noBroadcast: 1});
        return;
      }
    } else {
      if (anotherTab) return;
    }
    var _a = audioPlayer, aid = currentAudioId();
    if (!aid) return;
    switch (e.keyCode) {
      case 179:
        playAudioNew(aid);
        break;
      case 178:
        _a.stop();
        audioPlayer.onPlayProgress(0, 1, true);
        break;
      case 177:
        _a.prevTrack();
        break;
      case 176:
        _a.nextTrack();
        break;
    }
  },
  mouseUp: function(e) {
    var _a = audioPlayer;
    if (_a.player && _a.player.paused) {
      if (_a.prClicked) {
        if (_a.time !== undefined) try{
          if (!_a.player.paused()) {
            _a.player.playAudio(_a.time);
            _a.time = null;
          }
        }catch(e){};
      }
      _a.player.callPlayProgress();
    }
    if (_a.volClicked && _a.controls && _a.controls[_a.volClicked]) {
      removeClass(_a.controls[_a.volClicked].volumeArea, 'down');
    }
    if (_a.prClicked && _a.controls && _a.controls[_a.prClicked]) {
      removeClass(_a.controls[_a.prClicked].progressArea, 'down');
    }
    _a.volClicked = null;
    _a.prClicked = null;
  },
  mouseMove: function(e) {
    var _a = audioPlayer;
    if (_a.volClicked) _a.volClick(e, _a.volClicked);
    if (_a.prClicked) _a.prClick(e, _a.prClicked);
  },
  defX: function(e) {
    if (!e) e = window.event;
    var hscroll = !document.body.scrollLeft && (browser.ipad || browser.iphone4 || browser.ipod4) ? 0 : (document.all ? document.body.scrollLeft : window.pageXOffset);
    return intval(e.clientX + hscroll);
  },
  getPrPos: function(e, objName) {
    var _a = audioPlayer, el, pos, prSize, val, defX;
    if (objName && _a.controls && _a.controls[objName]) {
      el = _a.controls[objName].progressArea, pos = getXY(el,_a.controls[objName].fixed)[0],
      val = _a.defX(e) - pos, prSize = getSize(el)[0];
    } else {
      var aid = currentAudioId();
      el = ge('audio_back_line' + aid), pos = getXY(el)[0],
      val = _a.defX(e) - pos, prSize = getSize(el)[0];
    }
    val = Math.min(100, Math.max(0, val / prSize * 100));
    if (vk.rtl) val = 100 - val;
    _a.time = val / 100 * _a.duration;
    return val;
  },
  prClick: function(e, objName) {
    if (!e) e = window.event
    if (e.button == 2) return;
    var _a = audioPlayer, aid = currentAudioId();
    if (objName && _a.controls && _a.controls[objName] && _a.controls[objName].progressArea) {
      if (!_a.player) return;
      if (!_a.prClicked) {
        _a.prClicked = objName;
        addClass(_a.controls[objName].progressArea, 'down');
      }
    } else {
      if (!_a.prClicked) {
        _a.prClicked = true;
      }
    }
    var val = _a.getPrPos(e, objName);
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.progress) {
          setStyle(obj.progress, {width: val + '%'});
        }
      }
    }
    if (aid && ge('player' + aid)) {
      setStyle(ge('audio_pr_line' + aid), {width: val + '%'});
    }
    cancelEvent(e);
  },
  volClick: function(e, objName) {
    if (!e) e = window.event
    if (e.button == 2) return;
    var _a = audioPlayer, el, xy, val, pos;
    if (objName && _a.controls && _a.controls[objName] && _a.controls[objName].volumeArea) {
      var obj = _a.controls[objName];
      el = obj.volumeArea, pos = getXY(el, _a.controls[objName].fixed)[0], val = _a.defX(e) - pos;
      var volSize = getSize(el)[0], val = val / volSize * 100;
      if (!_a.volClicked) {
        _a.volClicked = objName;
        addClass(obj.volumeArea, 'down');
      }
    } else {
      var aid = currentAudioId();
      el = ge('audio_vol_back_line' + aid), pos = getXY(el)[0], val = _a.defX(e) - pos;
      var volSize = getSize(el)[0], val = val / volSize * 100;
      if (!_a.volClicked) {
        _a.volClicked = true;
      }
    }
    if (vk.rtl) val = 100 - val;
    val = Math.min(100, Math.max(0, val));
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.volume) {
          setStyle(obj.volume, {width: val + '%'});
        }
      }
    }
    if (aid && ge('player' + aid)) {
      setStyle(ge('audio_vol_line' + aid), {width: val + '%'});
    }
    if (_a.player) _a.player.setVolume(val / 100);
    setCookie('audio_vol', Math.round(val), 365);
    cancelEvent(e);
  },
  toggleRepeat: function() {
    var _a = audioPlayer, aid = currentAudioId();
    if (!aid && _a.lastSong) {
      aid = _a.lastSong.aid;
    }
    _a.repeat = !_a.repeat;
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.repeat) {
          toggleClass(obj.repeat, 'on', _a.repeat);
        }
      }
    }
    if (!aid) return;
    var r = ge('repeat' + aid);
    if (r) {
      toggleClass(r, 'on', _a.repeat);
    }
  },
  toggleStatus: function() {
    var _a = audioPlayer, aid = currentAudioId(), exp = _a.statusExport, c = ge('gp_status_check');
    if (!_a.addHash) return;
    checkbox('currinfo_audio', (_a.statusExport = !exp));
    if (c) {
      toggleClass(c, 'on', !exp);
      setStyle(c, {opacity: exp ? 0.6 : 1});
    }
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.status) {
          toggleClass(obj.status, 'on', !exp);
        }
      }
    }
    ajax.post('audio', {act: 'toggle_status', exp: (exp ? '' : 1), hash: _a.addHash, id: aid});
  },
  setControlsTitle: function() {
    var _a = audioPlayer;
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i], songInfo = obj.padPlaylist && _a.isPlaylistGlobal() ? ls.get('pad_lastsong') || _a.lastSong : _a.lastSong;
        if (obj.performer) {
          obj.performer.innerHTML = clean(replaceEntities(songInfo[5]));
        }
        if (obj.title) {
          obj.title.innerHTML = clean(replaceEntities(songInfo[6]));
        }
        if (obj.titleWrap) {
          if (obj.titleWrap.scrollWidth > obj.titleWrap.clientWidth) {
            var el = ce('div', {innerHTML: clean(replaceEntities(songInfo[5])) + ' &ndash; ' + clean(replaceEntities(songInfo[6])) });
            obj.titleWrap.title = el.innerText || el.textContent;
          } else {
            obj.titleWrap.removeAttribute('title');
          }
        }
        if (obj.duration) {
          obj.duration.innerHTML = songInfo[4];
        }
        if (obj.add) {
          var aid = currentAudioId();
          toggleClass(obj.add, 'added', !!(aid && cur.addedIds && cur.addedIds[aid]));
        }
      }
    }
    if (ge('gp')) _a.loadGlobal();
  },
  loadGlobal: function() {
    var l, _a = audioPlayer, aid = currentAudioId(), cl = aid && _a.player && !_a.player.paused() || !aid && _a.lastSong ? 'playing' : '';
    ge('gp_play_btn').innerHTML = '<a onmousedown="cancelEvent(event)" onclick="playAudioNew(\'' + aid + '\', false)"><div class="gp_play_wrap"><div id="gp_play" class="' + cl + '"></div></div></a>';
    var art, title;
    art = clean(replaceEntities(_a.lastSong[5]));
    title = clean(replaceEntities(_a.lastSong[6]));
    ge('gp_performer').innerHTML = art;
    ge('gp_title').innerHTML = title;
    updGlobalPlayer();
  },
  onError: function(error_msg) {
    var _a = audioPlayer, aid = currentAudioId();
    if (aid) _a.reloadAudio(aid);
    _a.reloadPlaylist();
  },
  onLoadComplete: function(len) {
    if (len) audioPlayer.duration = len;
  },
  onPlayFinish: function() {
    var _a = audioPlayer;
    _a.playbackSent = _a.statusSent = 0;
    var next_id, cur_id = currentAudioId(), m = (cur_id + '').match(/^-?\d+_\d+_s(\d+)$/);
    if (_a.repeat) {
      next_id = cur_id;
    } else if (m && window.audioPlaylist && audioPlaylist[cur_id]) {
      next_id = audioPlaylist[cur_id]['_next'];
      if (!next_id) {
        ajax.post('audio', {act: 'get_audio_status', mid: m[1]}, {
          onDone: function(id, info) {
            if (!info) return;

            if (cur_id !== id) {
              info['_prev'] = cur_id;
              audioPlaylist[cur_id]['_next'] = id;
              audioPlaylist[id] = info;
              audioPlaylist.start = id;
              if (!audioPlaylist.searchStr) {
                window.lastPlaylist = clone(audioPlaylist);
              }
              _a.setPadPlaylist(window.audioPlaylist);
            }
            if (!currentAudioId()) {
              _a.operate(id);
            }
          }
        });
      }
    } else {
      var pList = _a.isPlaylistGlobal() ? ls.get('pad_playlist') || window.audioPlaylist : padAudioPlaylist();
      next_id = (pList && pList[cur_id] && pList[cur_id]['_next']) ? pList[cur_id]['_next'] : _a.getNextSibling();
    }
    _a.stop();
    if (next_id && (_a.repeat || cur_id != next_id)) {
      _a.operate(next_id);
      if (window._pads && _pads.shown == 'mus' && window.Pads && Pads.setAudioCurPos) {
        Pads.setAudioCurPos(400);
        return;
      }
    }
  },
  scrollToTrack: function(nid) {
    var w = window, de = document.documentElement, play_btn = ge('play'+nid);
    if (window._pads && _pads.shown == 'mus' && window.Pads && Pads.setAudioCurPos) {
      Pads.setAudioCurPos(400);
      return;
    }
    if (!w.pageNode || !play_btn || nav.objLoc[0] == 'im') return;
    var xy = getXY(play_btn);
    var dheight = Math.max(intval(w.innerHeight), intval(de.clientHeight));
    var height = Math.max(0, xy[1] - (dheight - 16) / 2);
    scrollToY(height, 400);
  },
  nextTrack: function(no_scroll, fromPad) {
    var nid, _a = audioPlayer
    fromPad = fromPad && _a.isPlaylistGlobal();
    var aid = fromPad ? ls.get('audio_id') || currentAudioId() : currentAudioId(), pList = fromPad ? ls.get('pad_playlist') || window.audioPlaylist : window.audioPlaylist;
    nid = (pList && pList[aid]) ? pList[aid]['_next'] : _a.getNextSibling();
    if (nid) {
      _a.stop();
      if (fromPad) {
        window.padPlClicked = true;
      }
      _a.operate(nid);
      if (!no_scroll) _a.scrollToTrack(nid);
    }
  },
  prevTrack: function(no_scroll, fromPad) {
    var nid, _a = audioPlayer
    fromPad = fromPad && _a.isPlaylistGlobal();
    var aid = fromPad ? ls.get('audio_id') || currentAudioId() : currentAudioId(), pList = fromPad ? ls.get('pad_playlist') || window.audioPlaylist : window.audioPlaylist;
    pid = (pList && pList[aid]) ? pList[aid]['_prev'] : _a.getPrevSibling();
    if (pid) {
      _a.stop();
      if (fromPad) {
        window.padPlClicked = true;
      }
      _a.operate(pid);
      if (!no_scroll) _a.scrollToTrack(pid);
    }
  },
  getNextSibling: function(aid) {
    var getAId = function(el){return el && el.id && el.id.substr(0, 5) == 'audio' && parseInt(el.id.substr(5)) ? el.id.substr(5) : 0; }
    if (!aid) aid = currentAudioId();
    var cur = ge('audio' + aid);
    if (!cur) return null;
    var aid = 0;
    for (var el = cur.nextSibling; el; el = el.nextSibling) {
      if (aid = getAId(el)) return aid;
      if (isVisible(el) && (aid = getAId(el.firstChild))) return aid;
    }
    var p = cur.parentNode.nextSibling;
    while (p && p.nodeType != 1 && p.nextSibling) p = p.nextSibling;
    if (p && p.nodeType == 1) {
      var el = geByClass1('audio', p);
      if (aid = getAId(el)) return aid;
    }
    for (p = cur.parentNode.parentNode.firstChild; p; p = p.nextSibling) {
      if (p && p.nodeType == 1 && p != cur.parentNode) {
        var el = geByClass1('audio', p);
        if (aid = getAId(el)) return aid;
      }
    }
    for (var el = cur.parentNode.firstChild; el; el = el.nextSibling) {
      if (aid = getAId(el)) return aid;
    }
  },
  getPrevSibling: function(aid) {
    var getAId = function(el){return el && el.id && el.id.substr(0, 5) == 'audio' && parseInt(el.id.substr(5)) ? el.id.substr(5) : 0; }
    if (!aid) aid = currentAudioId();
    var cur = ge('audio' + aid);
    if (!cur) return null;
    var aid = 0;
    for (var el = cur.previousSibling; el; el = el.previousSibling) {
      if (aid = getAId(el)) return aid;
      if (isVisible(el) && (aid = getAId(el.firstChild))) return aid;
    }
    var p = cur.parentNode.previousSibling;
    while (p && p.nodeType != 1 && p.previousSibling) p = p.previousSibling;
    if (p && p.nodeType == 1) {
      var el = geByClass1('audio', p);
      if (aid = getAId(el)) return aid;
    }
    for (p = cur.parentNode.parentNode.lastChild; p; p = p.previousSibling) {
      if (p && p.nodeType == 1 && p != cur.parentNode) {
        var el = geByClass1('audio', p);
        if (aid = getAId(el)) return aid;
      }
    }
    for (var el = cur.parentNode.lastChild; el; el = el.previousSibling) {
      if (aid = getAId(el)) return aid;
    }
  },

  genPlaylist: function(res, copyToMain) {
    if (!res || !res.length) return;
    for (var i in res) {
      if (res[i][11] && parseInt(res[i][11])) {
        res.splice(i, 1);
      }
    }
    if (res[0]._order !== undefined) {
      res = res.sort(function(a,b) {return a._order - b._order});
    }
    cur.nextPlaylist = {};
    for (var i in res) {
      i = parseInt(i);
      var a = extend({}, res[i]);
      var aid = a.full_id || a[0]+'_'+a[1];
      cur.nextPlaylist[aid] = clone(a);
      if (i > 0) cur.nextPlaylist[aid]['_prev'] = res[i-1].full_id || res[i-1][0]+'_'+res[i-1][1];
      if (i < res.length - 1) cur.nextPlaylist[aid]['_next'] = res[i+1].full_id || res[i+1][0]+'_'+res[i+1][1];
    }
    var firstId = res[0].full_id || res[0][0]+'_'+res[0][1],
        lastId = res[res.length-1].full_id || res[res.length-1][0]+'_'+res[res.length-1][1];
    cur.nextPlaylist[firstId]['_prev'] = lastId;
    cur.nextPlaylist[lastId]['_next'] = firstId;
    cur.nextPlaylist.start = firstId;
    cur.nextPlaylist.length = res.length;
    cur.nextPlaylist.instance = cur.nextPlaylist.source = window.curNotifier && curNotifier.instance_id || '';
    cur.nextPlaylist.address = nav.strLoc;
    if (window._pads && _pads.shown == 'mus' && Pads.audioSearchStr) {
      cur.nextPlaylist.searchStr = Pads.audioSearchStr;
    }
    var aid = currentAudioId();
    if (copyToMain || cur.justShuffled && aid && cur.nextPlaylist[aid]) {
      window.audioPlaylist = clone(cur.nextPlaylist);
      if (window.curNotifier && (padPlData = ls.get('pad_pldata')) && padPlData.instance == curNotifier.instance_id) {
        this.setPadPlaylist(window.audioPlaylist);
      }
      if (!window.audioPlaylist.searchStr) {
        window.lastPlaylist = clone(window.audioPlaylist);
      }
    }
  },

  isPlaylistGlobal: function() {
    var padPlData;
    return (!window.audioPlaylist || window.curNotifier && (padPlData = ls.get('pad_pldata')) && padPlData.source == curNotifier.instance_id);
  },

  setPadPlaylist: function(pList) {
    if (pList) {
      ls.set('pad_playlist', pList);
      ls.set('pad_pltime', vkNow());
      if (!pList.instance && !pList.source && window.curNotifier && curNotifier.instance_id) {
        pList.instance = pList.source = curNotifier.instance_id;
      }
      if (pList.instance && pList.source) {
        this.setPadPlData({instance: pList.instance, source: pList.source});
      } else {
        this.setPadPlData();
      }
    } else {
      ls.remove('pad_playlist');
      ls.remove('pad_pltime');
    }
  },

  setPadPlData: function(obj) {
    if (obj) {
      ls.set('pad_pldata', obj);
    } else {
      ls.remove('pad_pldata');
    }
  },

  createDynamicPlaylist: function(aid, copyToMain, limit) {
    var _a = audioPlayer;
    if (!aid) return;
    var nextId = startId = aid, el = ge('audio' + aid), dynPl = [_a.getSongInfoFromDOM(startId)], k = 1;
    if (!limit) limit = 200;
    while (nextId = _a.getNextSibling(nextId)) {
      if (nextId == startId || k++ >= limit) break;
      dynPl.push(_a.getSongInfoFromDOM(nextId));
    }
    _a.genPlaylist(dynPl, copyToMain);
    if (hasClass(el.parentNode, 'module_body')) {
      ajax.post('/audio', {act: 'get_playlist', oid: cur.oid}, {
        onDone: function(res) {
          var obj = eval('(' + res + ')');
          if (obj && obj.all && window.audioPlaylist[aid]) {
            var found = false, audio_id = aid.split('_')[1], curId = aid, fullIds = {};
            do {
              var curAudioId = curId.split('_')[1];
              fullIds[curAudioId] = curId;
              curId = audioPlaylist[curId]._next;
            } while (curId != aid);
            for (var i in obj.all) {
              if (obj.all[i][1] == audio_id) {
                found = true;
              }
              if (fullIds[obj.all[i][1]]) {
                obj.all[i].full_id = fullIds[obj.all[i][1]];
              }
            }
            if (found) {
              _a.genPlaylist(obj.all, true);
            }
          }
        }
      })
    }
  },
  showCurrentTrack: function() {
    var _a = audioPlayer, aid = currentAudioId(), pad_aid = pad_aid_raw = ls.get('audio_id') || aid;
    if (aid && _a.player) {
      _a.setGraphics('load');
      if (_a.player.paused()) {
        _a.setGraphics('pause');
      } else {
        _a.setGraphics('play');
      }
      _a.setControlsTitle();
      _a.player.callPlayProgress();
      if (_a.player.callLoadProgress) _a.player.callLoadProgress();
      if (aid.substr(-4) !== '_pad' && ge('audio' + aid)) {
        addClass('audio' + aid, 'current');
      }
      if (pad_aid.substr(-4) !== '_pad') {
        pad_aid += '_pad';
      }
      if (ge('audio' + pad_aid) && _a.isPlaylistGlobal()) {
        var padClass = (window.curNotifier && (padPlData = ls.get('pad_pldata')) && padPlData.instance == curNotifier.instance_id) ? 'current' : 'tab_current';
        addClass('audio' + pad_aid, padClass);
        if (padClass == 'tab_current') {
          var curRow = geByClass1('current', ge('pad_playlist'));
          if (curRow) {
            removeClass(curRow, 'current');
          }
        }
      }
    }
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.repeat) toggleClass(obj.repeat, 'on', !!_a.repeat);
        if (obj.status) toggleClass(obj.status, 'on', !!_a.statusExport);
        if (obj.shuffle) toggleClass(obj.shuffle, 'on', !!_a.shuffle);
        if (obj.add) toggleClass(obj.add, 'added', !!(aid && cur.addedIds && cur.addedIds[aid]));
      }
    }
  },
  hideCurrentTrack: function() {
    var audios = geByClass('audio'), playBtns = geByClass('play_new');
    each(audios, function() {
      if (hasClass(this, 'current')) {
        removeClass(this, 'current');
      }
    });
    each(playBtns, function() {
      if (hasClass(this, 'playing')) {
        removeClass(this, 'playing');
      }
    });
  },
  formatTime: function(t) {
    var res, sec, min, hour;
    t = Math.max(t, 0);
    sec = t % 60;
    res = (sec < 10) ? '0'+sec : sec;
    t = Math.floor(t / 60);
    min = t % 60;
    res = min+':'+res;
    t = Math.floor(t / 60);
    if (t > 0) {
      if (min < 10) res = '0' + res;
      res = t+':'+res;
    }
    return res;
  },
  setCurTime: function(cur, len) {
    var _a = audioPlayer, aid = currentAudioId();
    var t = _a.timeLeft ? len - cur : cur,
        res = _a.formatTime(t);
    if (_a.timeLeft) res = vk.rtl ? res+'-' : '-'+res;
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.duration) obj.duration.innerHTML = res;
      }
    }
    var dur = ge('audio' + aid) && geByClass1('duration', ge('audio' + aid));
    if (dur && res) dur.innerHTML = res;
  },
  switchTimeFormat: function(id, event) {
    var _a = audioPlayer;
    _a.timeLeft = (_a.timeLeft + 1) % 2;
    if (_a.player) {
      _a.player.callPlayProgress();
    }
    setCookie('audio_time_left', _a.timeLeft);
    cancelEvent(event);
  },
  onLoadProgress: function(bLoaded, bTotal) {
    var _a = audioPlayer, aid = currentAudioId();
    if (isNaN(bTotal) && _a.player.onCanPlay) bTotal = _a.duration;
    var per = Math.ceil(bLoaded/bTotal*100);
    per = Math.min(100, Math.max(0, per));
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.load) setStyle(obj.load, {width: per + '%'});
      }
    }
    if (ge('player' + aid)) {
      setStyle(ge('audio_load_line' + aid), {width: per + '%'});
    }
  },
  onPlayProgress: function(pos, len, force) {
    var barSize, _a = audioPlayer, aid = currentAudioId();
    if (Math.abs(len - _a.duration) > 1 || isNaN(len)) len = _a.duration;
    if (_a.time && _a.player.paused()) pos = _a.time;
    _a.setCurTime(Math.round(pos), Math.round(len));
    if (_a.player.paused() && !force) return;
    var per = pos / len * 100;
    per = Math.min(100, Math.max(0, per));
    if (!_a.prClicked) {
      if (_a.controls) {
        for (var i in _a.controls) {
          var obj = _a.controls[i];
          if (obj.progress) {
              setStyle(obj.progress, {width: per + '%'});
          }
        }
      }
      if (ge('player' + aid)) {
        setStyle(ge('audio_pr_line' + aid), {width: per + '%'});
      }
    }
  },
  addCurrentTrack: function() {
    if (cur.addingAudio) return false;
    var _a = audioPlayer, aid = currentAudioId();
    if (!aid && _a.lastSong) {
      aid = _a.lastSong.aid;
    }
    if (aid && _a.addHash) {
      var ids = aid.split('_');
      if (ids.length == 1) {
        ids[1] = ids[0];
        ids[0] = vk.id;
      }
      cur.addingAudio = true;
      if (cur.addedIds && cur.addedIds[aid]) return false;
      if (ids && ids[0] && ids[1]) {
        var query = {act: 'add', oid: ids[0], aid: ids[1], hash: _a.addHash};
        if (_a.top) query.top = 1;
        ajax.post('audio', query, {
          onDone: function (data, res, text) {
            if (data && window.Audio && cur.id == vk.id && cur.audiosIndex && cur.audiosList && cur.audiosList['all'] && cur.aSearch) {
              var aobj = eval('('+data+')');
              aobj = aobj['all'][0];
              setTimeout(function(){
                var all_list = cur.audiosList['all'];
                if (all_list && all_list.length) {
                  aobj._order = all_list[0]._order - 1;
                  cur.audiosList['all'].splice(0,0,aobj);
                } else {
                  aobj._order = 0;
                  cur.audiosList['all'] = [aobj];
                }
                cur.audios[obj[1]] = aobj;
                cur.audiosIndex.add(aobj);
              }, 0);
            }
            if (!cur.addedIds) cur.addedIds = {};
            cur.addedIds[aid] = 1;
            showDoneBox(text, {out: 2000});
            cur.addingAudio = false;
            if (_a.controls) {
              for (var i in _a.controls) {
                var obj = _a.controls[i];
                if (obj.add) {
                  addClass(obj.add, 'added');
                  if (obj.add.tt) {
                    obj.add.tt.hide();
                  }
                }
              }
            }
          },
          onFail: function() {
            cur.addingAudio = false;
          }
        });
      }
    }
  },
  shuffleAudios: function() {
    var _a = audioPlayer, pl = window.audioPlaylist, aid = currentAudioId();
    if (aid) {
      var m = aid.match(/^-?\d+_\d+_s(\d+)$/);
      if (m && m[1] && _a.statusData && _a.statusData[m[1]]) {
        return false;
      }
    }
    if (!pl && _a.isPlaylistGlobal()) {
      pl = ls.get('pad_playlist');
      if (pl) {
        window.audioPlaylist = pl;
      }
    }
    if (nav.objLoc[0] != 'audio' && !pl) {
      return false;
    }
    _a.shuffle = !_a.shuffle;
    if (_a.controls) {
      for (var i in _a.controls) {
        var obj = _a.controls[i];
        if (obj.shuffle) {
          toggleClass(obj.shuffle, 'on', _a.shuffle);
        }
      }
    }
    if (nav.objLoc[0] == 'audio' && window.Audio) {
      Audio.mixAudios();
    } else {
      var aid = currentAudioId(), startId = pl.start, res = [], other = [];
      if (_a.shuffle) {
        for (var i in pl) {
          each(['_prev', '_next'], function() {
            if (pl[i][this] !== undefined) {
              pl[i]['_old'+this] = pl[i][this];
            }
          });
        }
        pl[startId]._start = true;
        if (aid && pl[aid]) {
          res.push(pl[aid]);
          startId = aid;
        } else {
          other.push(pl[startId]);
        }
      } else {
        for (var i in pl) {
          if (pl[i]._old_prev !== undefined && pl[i]._old_next !== undefined) {
            pl[i]._prev = pl[i]._old_prev;
            pl[i]._next = pl[i]._old_next;
            delete pl[i]._old_prev;
            delete pl[i]._old_next;
          }
          if (pl[i]._start) {
            startId = i;
            delete pl[i]._start;
          }
        }
        other.push(pl[startId]);
      }
      var curId = pl[startId]._next;
      while (curId && curId != startId && pl[curId]) {
        var obj = pl[curId];
        delete obj._order;
        other.push(obj);
        curId = pl[curId]._next;
      }
      if (other && _a.shuffle) {
        var shuffle = function(arr) {
          for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
          return true;
        }
        shuffle(other);
        other = clone(other);
      }
      for (var i in other) {
        res.push(other[i]);
      }
      _a.genPlaylist(res, true);
      if (Pads.updateAudioPlaylist) {
        Pads.updateAudioPlaylist();
      }
    }
    return false;
  },
  registerPlayer: function(name, obj) {
    var _a = audioPlayer;
    _a.controls = _a.controls || {};
    _a.controls[name] = obj;
    if (obj.duration) {
      addEvent(obj.duration, 'mousedown', function(){
        _a.switchTimeFormat();
      });
    }
    if (obj.volume && obj.volumeArea) {
      addEvent(obj.volumeArea, 'mousedown', function(e){
        _a.volClick(e, name);
      });
      var volume = parseInt(getCookie('audio_vol'));
      volume = Math.max(0, Math.min(volume, 100));
      setStyle(obj.volume, {width: volume + '%'});
    }
    if (obj.progress && obj.progressArea) {
      addEvent(obj.progressArea, 'mousedown', function(e){
        _a.prClick(e, name);
      });
      addEvent(obj.progressArea, 'mouseover', function(){
        if (_a.player) addClass(this, 'over');
      });
    }
    if (obj.play) {
      addEvent(obj.play, 'click', function(e){
        var aid = obj.padPlaylist && _a.isPlaylistGlobal() ? ls.get('audio_id') || currentAudioId() : currentAudioId() || (_a.lastSong && _a.lastSong.aid) || (cur.defaultTrack && cur.defaultTrack.id) || window.audioPlaylist && audioPlaylist.start || '';
        if (obj.padPlaylist) {
          window.padPlClicked = true;
        }
        if (aid) playAudioNew(aid, false);
      });
      addEvent(obj.play, 'mousedown', addClass.pbind(obj.play, 'down'));
      addEvent(obj.play, 'mouseup', removeClass.pbind(obj.play, 'down'));
    }
    var clickClbks = {
      prev: _a.prevTrack.pbind(false, !!obj.padPlaylist),
      next: _a.nextTrack.pbind(false, !!obj.padPlaylist),
      add: _a.addCurrentTrack,
      repeat: _a.toggleRepeat,
      shuffle: _a.shuffleAudios,
      status: _a.toggleStatus
    };
    for (var i in clickClbks) {
      if (obj[i]) {
        var callback = clickClbks[i];
        addEvent(obj[i], 'click', callback.pbind(false));
      }
    }
    var overTTs = {
      add: 'audio_add_to_audio',
      repeat: 'audio_repeat_tooltip',
      shuffle: 'audio_shuffle',
      status: 'audio_export_tip'
    };
    each(['prev', 'next', 'play', 'add', 'repeat', 'status', 'shuffle', 'volumeArea'], function(){
      if (obj[this]) {
        var self = this;
        addEvent(obj[this], 'mouseover', function() {
          addClass(this, 'over');
          if (overTTs[self] && !(self == 'add' && hasClass(this, 'added'))) {
            showTooltip(this, {text: getLang(overTTs[self]), showdt: 0, black: 1, shift: [11, 0, 0]});
          }
        });
      }
    });
    each(['prev', 'next', 'play', 'add', 'repeat', 'status', 'shuffle', 'volumeArea', 'progressArea'], function(){
      if (obj[this]) {
        addEvent(obj[this], 'mouseout', function() {
          removeClass(this, 'over');
          removeClass(this, 'down');
        });
      }
    });
  },
  deregisterPlayer: function(name) {
    var _a = audioPlayer, obj = audioPlayer.controls[name];
    if (obj.duration) {
      removeEvent(obj.duration, 'mousedown', function(){
        _a.switchTimeFormat();
      });
    }
    if (obj.volume && obj.volumeArea) {
      removeEvent(obj.volumeArea, 'mousedown', function(e){
        _a.volClick(e, name);
      });
    }
    if (obj.progress && obj.progressArea) {
      removeEvent(obj.progressArea, 'mousedown', function(e){
        _a.prClick(e, name);
      });
      removeEvent(obj.progressArea, 'mouseover', function(){
        if (_a.player) addClass(this, 'over');
      });
      removeEvent(obj.progressArea, 'mouseout', removeClass.pbind(obj.progressArea, 'over'));
    }
    if (obj.play) {
      removeEvent(obj.play, 'click', function(e){
        var aid = obj.padPlaylist && _a.isPlaylistGlobal() ? ls.get('audio_id') || currentAudioId() : currentAudioId() || (_a.lastSong && _a.lastSong.aid) || (cur.defaultTrack && cur.defaultTrack.id) || window.audioPlaylist && audioPlaylist.start || '';
        if (obj.padPlaylist) {
          window.padPlClicked = true;
        }
        if (aid) playAudioNew(aid, false);
      });
      removeEvent(obj.play, 'mousedown', addClass.pbind(obj.play, 'down'));
      removeEvent(obj.play, 'mouseup', removeClass.pbind(obj.play, 'down'));
    }
    var clickClbks = {
      prev: _a.prevTrack.pbind(false, !!obj.padPlaylist),
      next: _a.nextTrack.pbind(false, !!obj.padPlaylist),
      add: _a.addCurrentTrack,
      repeat: _a.toggleRepeat,
      status: _a.toggleStatus
    };
    for (var i in clickClbks) {
      if (obj[i]) {
        var callback = clickClbks[i];
        removeEvent(obj[i], 'click', callback.pbind(false));
      }
    }
    var overTTs = {
      add: 'audio_add_to_audio',
      repeat: 'audio_repeat_tooltip',
      shuffle: 'audio_shuffle',
      status: 'audio_export_tip'
    };
    each(['prev', 'next', 'play', 'add', 'repeat', 'status', 'shuffle', 'volumeArea'], function(){
      if (obj[this]) {
        var self = this;
        removeEvent(obj[this], 'mouseover', function() {
          addClass(this, 'over');
          if (overTTs[self] && !(self == 'add' && hasClass(this, 'added'))) {
            showTooltip(this, {text: getLang(overTTs[self]), showdt: 0, black: 1, shift: [11, 0, 0]});
          }
        });
      }
    });
    each(['prev', 'next', 'play', 'add', 'repeat', 'status', 'shuffle', 'volumeArea', 'progressArea'], function(){
      if (obj[this]) {
        removeEvent(obj[this], 'mouseout', function() {
          removeClass(this, 'over');
          removeClass(this, 'down');
        });
      }
    });
    delete audioPlayer.controls[name];
  }
}

try{stManager.done('audioplayer.js');}catch(e){}
