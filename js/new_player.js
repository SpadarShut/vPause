var audioPlayer = {
  id: null,
  player: null,
  volW: 33,
  prX: 14,
  gpSz: 330,
  gpMinW: 154,
  gpMaxW: 553,
  images: {
    icon: '/images/favicon' + (vk.intnat ? '_vk' : 'new') + '.ico',
    playicon: '/images/playiconnew.ico',
    pauseicon: '/images/pauseiconnew.ico'
  },
  songInfos: {},
  initPlayer: function(id) {
    var _a = audioPlayer;
    if (browser.mobile || browser.msie6) _a.gpDisabled = true;
    if (browser.flash >= 9) {
      var opts = {
        url: '/swf/audio_lite.swf',
        id: 'player'
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
      var html5AudioSupport = false;
      try {
        var audioObj = ce('audio');
        if (('no' != audioObj.canPlayType('audio/mpeg')) && ('' != audioObj.canPlayType('audio/mpeg'))) html5AudioSupport=true;
      } catch (e){}
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
    var _n = window.Notifier;
    if (_n) {
      _n.addRecvClbk('audio_start', 'audio', function(data) {
        var _a = window.audioPlayer;
        if (_a) {
          if (_a.player && !_a.player.paused()) _a.pauseTrack();
          _a.pausedByVideo = null;
        }
      });
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
    if (!ge('gp') && !_a.gpDisabled) {
      document.body.appendChild(ce('div', {id: 'gp', className: 'fixed'}));
      addEvent(ge('gp'), 'mouseover', function() {expandGlobalPlayer(true);});
      addEvent(ge('gp'), 'mouseout', function() {expandGlobalPlayer(false);});
      addEvent(ge('gp'), 'dragstart', function() {return false;});
      addEvent(ge('gp'), 'selectstart', function() {return false;});
      ge('gp').innerHTML = '<div class="wrap">\
  <div id="gp_back"><div><!-- --></div></div>\
  <div id="gp_wrap" onmousedown="audioPlayer.startDrag(event)">\
    <div class="audio" id="audio_global">\
      <div id="gp_small">\
        <div class="play_btn fl_l" id="gp_play_btn_small"></div>\
        <div class="audio_info fl_l" id="gp_audio_info_small"></div>\
      </div>\
      <div id="gp_large">\
        <div class="play_btn fl_l" id="gp_play_btn_large" onmouseover="audioPlayer.tip(this, (audioPlayer.id && !audioPlayer.player.paused()) ? \'audio_pause_tip\' : \'audio_play_tip\', false, -9, -13, -12);"></div>\
        <div class="gp_controls fl_l">\
          <div class="prev" onmouseover="if (audioPlayer.highLight(this, \'prev\', 1)) audioPlayer.tip(this, \'audio_prev_tip\');" onmouseout="audioPlayer.highLight(this, \'prev\', 0)" onmousedown="cancelEvent(event)" onclick="audioPlayer.prevTrack();"></div>\
          <div class="repeat" onmouseover="animate(this, {opacity: .8}, 100); audioPlayer.tip(this, \'audio_repeat_tooltip\');" onmouseout="animate(this, {opacity: hasClass(this, \'on\') ? 1 : .6}, 100)" onmousedown="cancelEvent(event)" onclick="audioPlayer.toggleRepeat();"></div>\
          <div class="next" onmouseover="if (audioPlayer.highLight(this, \'next\', 1)) audioPlayer.tip(this, \'audio_next_tip\');" onmouseout="audioPlayer.highLight(this, \'next\', 0)" onmousedown="cancelEvent(event)" onclick="audioPlayer.nextTrack();"></div>\
        </div>\
        <div id="gp_add" class="add_wrap fl_l">\
          <div class="add" onmouseover="if (audioPlayer.highLight(this, \'add\', 1)) audioPlayer.tip(this, \'audio_add_to_audio\', false, 0, -1, 1);" onmouseout="audioPlayer.highLight(this, \'add\', 0)" onmousedown="cancelEvent(event)" onclick="audioPlayer.addCurrentTrack();"></div>\
        </div>\
        <div class="padd fl_l"><br/></div>\
        <div class="lines_wrap fl_l">\
          <div class="audio_info fl_l" id="gp_audio_info_large">\
            <div class="title_wrap"></div>\
            <div class="player_wrap">\
              <div id="gp_line" class="playline"><div></div></div>\
              <div id="gp_player" class="player" ondragstart="return false;" onselectstart="return false;">\
                <table cellspacing="0" cellpadding="0" border="0" width="100%">\
                  <tbody><tr>\
                    <td style="width: 100%; padding: 0px; position: relative;">\
                      <div id="gp_back_line" class="audio_white_line" onmousedown="audioPlayer.prClick(event);"></div>\
                      <div id="gp_load_line" class="audio_load_line" onmousedown="audioPlayer.prClick(event);"><!-- --></div>\
                      <div id="gp_pr_line" class="audio_progress_line" onmousedown="audioPlayer.prClick(event);">\
                        <div id="gp_pr_slider" class="audio_pr_slider"><!-- --></div>\
                      </div>\
                    </td>\
                  </tr>\
                </tbody></table>\
              </div>\
            </div>\
          </div>\
          <div class="audio_vol fl_l" id="gp_vol" ondragstart="return false;" onselectstart="return false;"></div>\
        </div>\
        <div class="fl_l" id="gp_status">\
          <div onmouseover="animate(this, {opacity: .8}, 100); audioPlayer.tip(this, \'audio_export_tip\', true);" onmouseout="animate(this, {opacity: hasClass(this, \'on\') ? 1 : .6}, 100)" onmousedown="cancelEvent(event)" onclick="audioPlayer.toggleStatus();" id="gp_status_check"></div>\
        </div>\
        <div class="close fl_l">\
          <div id="gp_close_wrap" onmouseover="ge(\'gp_close\').style.backgroundPosition = \'0 -76px\'" onmouseout="ge(\'gp_close\').style.backgroundPosition = \'0 -68px\'" onclick="audioPlayer.closePlayer();">\
            <div id="gp_close"></div>\
          </div>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>';
    }
  },
  tip: function(el, key, inv, dx, dy1, dy2) {
    if (browser.msie && browser.version < 9) return;
    if (audioPlayer.gotData <= 0 || !window.lang || !lang[key]) return;
    inv = inv ? !hasClass('gp', 'reverse') : hasClass('gp', 'reverse');
    if (el.tt && el.tt.container) {
      (inv ? addClass : removeClass)(el.tt.container, 'gp_tip_inv');
      val(geByClass1('gp_tip_text', el.tt.container), lang[key]);
    }
    showTooltip(el, {
      content: '<div class="gp_tip_text">' + lang[key] + '</div>',
      className: 'gp_tip' + (inv ? ' gp_tip_inv' : ''),
      shift: [4 + intval(dx), 13 + intval(dy1), 16 + intval(dy2)],
      asrtl: inv
    });
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
      _a.timeLeft = parseInt(getCookie('audio_time_left')) || 1;
      var pos = ls.get('audio_pos');
      _a.pos = (pos && pos.l != undefined && pos.t != undefined) ? pos : false;
      var volume = parseInt(getCookie('audio_vol'));
      if (!isNaN(volume)) _a.player.setVolume(volume / 100);
      addEvent(document,'mouseup',_a.mouseUp);
      addEvent(document,'mousemove',_a.mouseMove);
      _a.operate(id, true);
      if (!_a.gotData) {
        _a.gotData = -1;
        ajax.post('audio', {act: 'get_data'}, {
          onDone: function(hash, exp, langs) {
            window.lang = extend(window.lang || {}, langs);
            _a.addHash = hash;
            checkbox('currinfo_audio', (_a.statusExport = exp));
            if (exp) {
              addClass('gp_status_check', 'on');
              _a.playback(_a.paused);
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
  closePlayer: function() {
    var _a = audioPlayer;
    if (_a.id && !ge('audio'+_a.id)) _a.stop();
    _a.gpDisabled = true;
    toggleGlobalPlayer(false);
  },
  setIcon: function(icon) {
    setFavIcon(audioPlayer.images[icon]);
  },
  setSongInfo: function() {
    var _a=audioPlayer;

    if (window.audioPlaylist && audioPlaylist[_a.id]) {
      _a.lastSong = audioPlaylist[_a.id];
    } else if (_a.songInfos[_a.id]) {
      _a.lastSong = _a.songInfos[_a.id];
    } else {
      var art, title, nfo = geByClass1('info', ge('audio'+_a.id));
      art = geByTag1('b', nfo);
      l = geByTag1('a', art);
      if (l) art = l;
      var reArr = ['<span>', '</span>', '<span class="match">'];
      var re = new RegExp(reArr.join('|'), "gi");
      art = art.innerHTML.replace(re, '');
      title = geByClass1('title', nfo);
      if (!title) title = ge('title'+_a.id);
      l = geByTag1('a', title);
      if (l) title = l.innerHTML;
      else title = title.innerHTML;
      title = title.replace(re, '');
      dur = geByClass1('duration', nfo).innerHTML;
      var data=ge('audio_info'+_a.id).value.split(',');
      var url=data[0];
      var duration=parseInt(data[1]);
      data = _a.id.split('_');
      var uid = data[0];
      var aid = data[1];
      _a.lastSong = {0: uid, 1:aid, 2:url, 3:duration, 4:dur, 5: art, 6:title};
    }
    _a.lastSong.aid = _a.id;
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
        query['edit'] = cur.edit;
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
          if (ge('gp')) _a.loadGlobal();
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
    if (ge('video_player') && ge('video_player').playVideo) ge('video_player').playVideo(false);
  },
  operate: function(id, nextPlaylist, opts) {
    var _a = audioPlayer;

    if (opts && opts.songInfo) {
      _a.songInfos[id] = opts.songInfo;
    }
    if (!_a.player || (!ge('flash_audio') && !ge('html5_audio'))) {
      _a.initPlayer(id);
      return;
    }

    if (_a.id == id) {
      if (cur && cur.edit) {
        _a.stop();
        var dis = _a.gpDisabled;
        if (ge('gp')) toggleGlobalPlayer(false);
        _a.gpDisabled = dis;
        return;
      }
      var key, plBtn = ge('gp_play_btn_large'), plBtnTT = plBtn && plBtn.tt && plBtn.tt.container;
      if (_a.player.paused()) {
        _a.sendNotification();
        if (_a.pausedByVideo) _a.pausedByVideo = null;
        if (_a.time != undefined) {
          try {_a.player.playAudio(_a.time)}catch(e){};
          _a.time = null;
        } else _a.player.playAudio();
        _a.setGraphics('play');
        _a.playback();
        if (!nextPlaylist) {
          if (ge('audio'+id)) _a.scrollToTrack(id);
        }
        key = 'audio_pause_tip';
      } else {
        _a.player.pauseAudio();
        _a.setGraphics('pause');
        _a.playback(true);
        key = 'audio_play_tip';
      }
      if (plBtnTT && window.lang && lang[key]) {
        val(geByClass1('gp_tip_text', plBtnTT), lang[key]);
      }
    } else {
      _a.sendNotification();
      if (_a.pausedByVideo) _a.pausedByVideo = null;
      if (_a.id) _a.stop();
      _a.id = id;
      if (nextPlaylist) {
        if (cur.curSection == 'popular' || cur.audioTop) {
          _a.top = true;
        } else {
          delete _a.top;
        }
        _a.setPlaybackParams();
        if (cur && cur.nextPlaylist && cur.nextPlaylist[id]) {
          window.audioPlaylist = clone(cur.nextPlaylist);
          cur.nextPlaylist = null;
        } else {
          if (window.audioPlaylist && !window.audioPlaylist[id]) window.audioPlaylist = null;
        }
      }
      if (_a.lastSong == undefined || id != _a.lastSong.aid) _a.setSongInfo();
      var url = _a.lastSong[2];
      _a.duration = _a.lastSong[3];
      _a.player.loadAudio(url);
      if (ge('gp')) _a.loadGlobal();
      /*var nid=_a.getNextSibling();
      if (nid) {
        var next_data=ge('audio_info'+nid).value.split(',');
        _a.player.preloadAudio(next_data[0]);
      }*/
      var ids = id.split('_');
      var uid = (ids && ids.length > 1) ? ids[0] : vk.id;
      if (intval(uid) == cur.audioFriend) {
        cur.audioFriendPlaying = cur.audioFriend;
        if (window.Audio) Audio.cacheFriendsList();
      }
      if (vk.id > 0) {
        show('gp_status');
        if (uid != vk.id) {
          show('gp_add');
          _a.gpMaxW = 553;
          if (cur.addedIds && cur.addedIds[id]) {
            addClass(ge('gp_add'), 'added');
          } else {
            removeClass(ge('gp_add'), 'added');
          }
        } else {
          hide('gp_add');
          _a.gpMaxW = 529;
        }
      } else {
        hide('gp_add', 'gp_status');
        _a.gpMaxW = 500;
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
  },
  setGraphics: function(act) {
    var _a=audioPlayer;
    var _gp = ge('gp');
    var _row = ge('audio'+_a.id);
    if (!_a.id) return;
    switch (act) {
      case 'play':
        _a.setIcon('playicon');
        if (_row) {
          var size = (cur && cur.edit) ? 26 : 16;
          ge('play'+_a.id).style.backgroundPosition='0px -'+size+'px';
          show('player'+_a.id);
          hide('line'+_a.id);
          fadeTo(ge('audio_pr_slider'+_a.id),400,1);
        }
        if (_gp) {
          ge('gp_play_large').style.backgroundPosition='0px -11px';
          ge('gp_play_small').style.backgroundPosition='0px -11px';
          show('gp_player');
          hide('gp_line');
          fadeTo(ge('gp_pr_slider'),400,1);
        }
        break;
      case 'pause':
        _a.setIcon('pauseicon');
        if (_row) {
          ge('play'+_a.id).style.backgroundPosition='0px 0px';
          fadeTo(ge('audio_pr_slider'+_a.id),400,0.5);
        }
        if (_gp) {
          ge('gp_play_large').style.backgroundPosition='0px 0px';
          ge('gp_play_small').style.backgroundPosition='0px 0px';
          show('gp_player');
          hide('gp_line');
          fadeTo(ge('gp_pr_slider'),400,0.5);
        }
        break;
      case 'stop':
        _a.setIcon('icon');
        if (_row) {
          hide('player'+_a.id);
          show('line'+_a.id);
          if (ge('repeat'+_a.id)) hide('repeat'+_a.id);
          ge('play'+_a.id).style.backgroundPosition='0px 0px';

          if (_a.id) {
            var t = _a.duration || _a.lastSong && _a.lastSong[3] || ge('audio_info'+_a.id).split(',')[1],
                res = _a.formatTime(t),
                dur = geByClass1('duration', ge('audio'+_a.id));
            if (dur && res) dur.innerHTML = res;
          }

        }
        if (_gp) {
          ge('gp_play_large').style.backgroundPosition='0px 0px';
          ge('gp_play_small').style.backgroundPosition='0px 0px';
          setStyle(ge('gp_pr_slider'), {opacity: .5});
          ge('gp_pr_slider').style.left='0px';
        }
        break;
      case 'load':
        var loaded=0; //(_a.isHTML5)?100:0;
        var vol=Math.round(_a.volW*_a.player.getVolume());
        if (vk.rtl) vol = vol-_a.volW;
        _a.setIcon('playicon');
        if (_row) {
          if (!ge('audio_volume_line'+_a.id) && !browser.ipad && !browser.iphone4 && !browser.ipod4) {
            var el=ge('audio_vol'+_a.id);
            el.style.padding = (vk.rtl) ? "1px 20px 0px 0px" : "1px 0px 0px 20px";
            var nosort = (cur && cur.edit) ? ' nosorthandle="1"' : '';
            el.innerHTML += '\
              <div id="audio_white_volume_line'+_a.id+'" class="audio_white_volume_line" onmousedown="audioPlayer.volClick(event);"'+nosort+'><!-- --></div>\
              <div id="audio_volume_line'+_a.id+'" class="audio_volume_line" onmousedown="audioPlayer.volClick(event);"'+nosort+'>\
                <div id="audio_vol_slider'+_a.id+'" class="audio_vol_slider"'+nosort+'><!-- --></div>\
              </div>';
          }
          if (ge('audio_volume_line'+_a.id)) {
            ge('audio_vol_slider'+_a.id).style.left=vol+'px';
          }
          var size = (cur && cur.edit) ? 26 : 16;
          ge('play'+_a.id).style.backgroundPosition='0px -'+size+'px';
          ge('audio_pr_slider'+_a.id).style.left='0px';
          ge('audio_pr_slider'+_a.id).style.opacity = 1;
          ge('audio_progress_line'+_a.id).style.width = loaded+'%';
          var r = ge('repeat'+_a.id);
          if (r) {
            show(r);
            if (_a.repeat) {
              addClass(r, 'on');
            } else {
              removeClass(r, 'on');
            }
          }
          show('player'+_a.id);
          hide('line'+_a.id);
        }
        if (_gp) {
          var rev = ls.get('audio_rev');
          if (rev) {
            addClass(_gp, 'reverse');
            _gp.rev = 1;
          }
          if (!ge('gp_vol_line') && !browser.ipad && !browser.iphone4 && !browser.ipod4) {
            var el=ge('gp_vol');
            el.innerHTML = '\
              <div id="gp_vol_back" class="audio_white_volume_line" onmousedown="audioPlayer.volClick(event);"><!-- --></div>\
              <div id="gp_vol_line" class="audio_volume_line" onmousedown="audioPlayer.volClick(event);">\
                <div id="gp_vol_slider" class="audio_vol_slider"><!-- --></div>\
              </div>';
          }
          if (!isVisible(_gp) && !_a.gpDisabled && nav && nav.objLoc) {
            toggleGlobalPlayer(true);
          }
          if (ge('gp_vol_slider')) {
            ge('gp_vol_slider').style.left=vol+'px';
          }
          ge('gp_play_large').style.backgroundPosition='0px -11px';
          ge('gp_play_small').style.backgroundPosition='0px -11px';
          ge('gp_pr_slider').style.left='0px';
          ge('gp_pr_slider').style.opacity = 1;
          ge('gp_pr_line').style.width = loaded+'%';
          var r = ge('gp_repeat');
          if (r) {
            show(r);
            if (_a.repeat) {
              addClass(r, 'on');
            } else {
              removeClass(r, 'on');
            }
          }
          show('gp_player');
          hide('gp_line');
        }
        break;
    }
  },
  stop: function() {
    var _a=audioPlayer;
    if (_a.id) {
      if (_a.player) _a.player.stopAudio();
      _a.setGraphics('stop');
      _a.id=null;
    }
  },
  pauseTrack: function() {
    var _a = window.audioPlayer;
    if (_a.id && _a.player && !_a.player.paused()) {
      _a.operate(_a.id);
    }
  },
  playTrack: function() {
    var _a = window.audioPlayer;
    if (_a.id && _a.player && _a.player.paused()) {
      _a.operate(_a.id);
    }
  },
  setPlaybackParams: function() {
    var _a = audioPlayer, full_id = _a.id, ids = (full_id || '').split('_'), params = {};
    if (cur.curSection == 'recommendations') params.recommendation = 1;
    if (nav.objLoc[0] == 'search' && nav.objLoc['c[section]'] == 'audio' && !nav.objLoc['c[q]']) params.top = 1;
    if (nav.objLoc[0] == 'audio' && nav.objLoc['act'] == 'popular' && !nav.objLoc['q']) params.top_audio = 1;
    if ((full_id + '').match(/^-?\d+_\d+_s(\d+)$/) && window.audioPlaylist && audioPlaylist[full_id]) params.status = 1;
    if (_a.isAudioFriend(ids[0], full_id)) params.friend = ids[0];
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
    var _a = audioPlayer, full_id = _a.id, ids = (full_id || '').split('_');
    if (_a.statusExport && ids[1] != _a.statusSent) {
      setTimeout(ajax.post.pbind('audio', {act: 'audio_status', full_id: full_id, hash: _a.addHash}), 0);
      _a.statusSent = ids[1];
    }
    clearTimeout(_a.playbackTimer);
    if (!paused && full_id && vk.id) {
      if (ids[1] != _a.playbackSent) {
        _a.playbackTimer = setTimeout(function() {
          var query = {act: 'playback', full_id: full_id, hash: _a.addHash};
          if (ids[0] == vk.id && ids[1]) query.id = ids[1];
          if (_a.playbackParams) extend(query, _a.playbackParams);
          ajax.post('audio', query, {onDone: function() {
            _a.playbackSent = ids[1];
          }});
        }, 10000);
      }
    }
  },
  mouseUp: function(e) {
    var _a=audioPlayer;
    var _gp=ge('gp');
    var _row = ge('audio'+_a.id);
    if (!_a.player || !_a.player.paused) return;
    if (!_a.player.paused() && !browser.ipad && !browser.iphone4 && !browser.ipod4) {
      if (_row) fadeTo(ge('audio_pr_slider'+_a.id),400,1);
      if (_gp) fadeTo(ge('gp_pr_slider'),400,1);
    }
    if (_row && ge('audio_volume_line'+_a.id)) fadeTo(ge('audio_vol_slider'+_a.id),400,1);
    if (_gp && ge('gp_vol_line')) fadeTo(ge('gp_vol_slider'),400,1);
    if (_a.prClicked && !_a.player.paused()) {
      if (_a.time !== undefined) try{_a.player.playAudio(_a.time);}catch(e){};
      _a.time=null;
    }
    _a.player.callPlayProgress();
    _a.volClicked=null;
    _a.prClicked=null;
    _a.globClicked=null;
  },
  mouseMove: function(e) {
    var _a=audioPlayer;
    var _gp = ge('gp');
    var _row = ge('audio'+_a.id);
    if (_a.volClicked) _a.volClick(e);
    if (_a.prClicked) {
      var curPos=_a.getPrPos(e);
      if (_gp) {
        var glPos;
        var gSz = getSize(ge('gp_load_line'))[0] - _a.prX;
        var curSz = getSize(ge('audio_load_line'+_a.id))[0] - _a.prX;
        if (_a.globClicked) {
          glPos = curPos;
          curPos = curSz / gSz * curPos;
        } else {
          glPos =  gSz / curSz * curPos;
        }
        ge('gp_pr_slider').style.left=glPos+'px';
      }
      if (_row) ge('audio_pr_slider'+_a.id).style.left=curPos+'px';
    }
  },
  defX: function(e) {
    if (!e) e=window.event;
    var hscroll = !document.body.scrollLeft && (browser.ipad || browser.iphone4 || browser.ipod4) ? 0 : (document.all ? document.body.scrollLeft : window.pageXOffset);
    return intval(e.clientX+hscroll);
  },
  getPrPos: function(e) {
    var _a=audioPlayer;
    var el = (_a.globClicked) ? ge('gp_pr_line') : ge('audio_progress_line'+_a.id);
    var xy=getXY(el);
    var curPos=_a.defX(e)-xy[0]-7;
    el = (_a.globClicked) ? ge('gp_load_line') : ge('audio_load_line'+_a.id);
    var barSize=getSize(el);
    var prLen=barSize[0]-_a.prX;
    if (curPos<0) curPos=0;
    if (curPos>prLen) curPos=prLen;
    var val = (vk.rtl) ? prLen-curPos : curPos;
    _a.time=val/prLen*_a.duration;
    return (vk.rtl) ? curPos-prLen : curPos;
  },
  prClick: function(e) {
    if (!e) e = window.event
    if (e.button == 2) return;
    var _a=audioPlayer;
    var _gp = ge('gp');
    var _row = ge('audio'+_a.id);
    var t_id = (e.target || e.srcElement).id;
    if (_a.globClicked == undefined) _a.globClicked = (_gp && t_id && t_id.substr(0,2) == 'gp');
    if (!_a.prClicked) {
      _a.prClicked=true;
      if (!browser.ipad && !browser.iphone4 && !browser.ipod4) {
        if (_row) fadeTo(ge('audio_pr_slider'+_a.id),400,0.5);
        if (_gp) fadeTo(ge('gp_pr_slider'),400,0.5);
      }
    }
    var curPos=_a.getPrPos(e);
    if (_gp) {
      var glPos;
      var gSz = getSize(ge('gp_load_line'))[0] - _a.prX;
      var curSz = getSize(ge('audio_load_line'+_a.id))[0] - _a.prX;
      if (_a.globClicked) {
        glPos = curPos;
        curPos = curSz / gSz * curPos;
      } else {
        glPos = gSz / curSz * curPos;
      }
      ge('gp_pr_slider').style.left=glPos+'px';
    }
    if (_row) ge('audio_pr_slider'+_a.id).style.left=curPos+'px';
    cancelEvent(e);
  },
  volClick: function(e) {
    if (!e) e = window.event
    if (e.button == 2) return;
    var _a=audioPlayer;
    var _row = ge('audio'+_a.id);
    var _gp = ge('gp');
    var t_id = (e.target || e.srcElement).id;
    if (_a.globClicked == undefined) _a.globClicked = (_gp && t_id && t_id.substr(0,2) == 'gp');
    var el = (_a.globClicked) ? ge('gp_vol_line') : ge('audio_volume_line'+_a.id);
    var xy = getXY(el);
    var val=_a.defX(e)-xy[0]-3;
    if (val<0) val=0;
    if (val>_a.volW) val=_a.volW;
    _a.player.setVolume(val/_a.volW);
    if (!_a.volClicked) {
      _a.volClicked=true;
      if (_row) fadeTo(ge('audio_vol_slider'+_a.id),400,0.5);
      if (_gp) fadeTo(ge('gp_vol_slider'),400,0.5);
    }
    var curPos = (vk.rtl) ? val-_a.volW : val;
    if (_row) ge('audio_vol_slider'+_a.id).style.left=curPos+'px';
    if (_gp) ge('gp_vol_slider').style.left=curPos+'px';
    cancelEvent(e);

    setCookie('audio_vol',Math.round(val/_a.volW*100),365);
  },
  toggleRepeat: function() {
    var _a=audioPlayer;
    var _gp=ge('gp');
    if (!_a.id) return;
    var r = ge('repeat'+_a.id);
    if (r) {
      if (hasClass(r, 'on')) {
        _a.repeat = false;
        removeClass(r, 'on');
      } else {
        _a.repeat = true;
        addClass(r, 'on');
      }
    }
    if (_gp) {
      r = geByClass1('repeat', _gp);
      if (hasClass(r, 'on')) {
        _a.repeat = false;
        removeClass(r, 'on');
        setStyle(r, {opacity: .6});
      } else {
        _a.repeat = true;
        addClass(r, 'on');
        setStyle(r, {opacity: 1});
      }
    }
  },
  toggleStatus: function() {
    var _a = audioPlayer, exp = _a.statusExport, c = ge('gp_status_check');
    if (!_a.addHash) return;
    if (exp) {
      checkbox('currinfo_audio', (_a.statusExport = false));
      removeClass(c, 'on');
      setStyle(c, {opacity: 0.6});
    } else {
      checkbox('currinfo_audio', (_a.statusExport = true));
      addClass(c, 'on');
      setStyle(c, {opacity: 1});
    }
    ajax.post('audio', {act: 'toggle_status', exp: (exp ? '' : 1), hash: _a.addHash, id: audioPlayer.id});
  },
  loadGlobal: function() {
    var l, _a = audioPlayer;
    ge('gp_play_btn_small').innerHTML = '<a onmousedown="cancelEvent(event)" onclick="playAudioNew(\''+_a.id+'\', false)"><div class="gp_play_wrap"><div class="gp_play" id="gp_play_small"></div></div></a>';
    ge('gp_play_btn_large').innerHTML = '<a onmousedown="cancelEvent(event)" onclick="playAudioNew(\''+_a.id+'\', false)"><div class="gp_play_wrap"><div class="gp_play" id="gp_play_large"></div></div></a>';
    var art, title, dur;
    dur = _a.timeLeft ? '-'+_a.lastSong[4] : '0:00';
    art = clean(replaceEntities(_a.lastSong[5]));
    title = clean(replaceEntities(_a.lastSong[6]));

    if (!ge('fake_text')) document.body.appendChild(ce('div', {id: 'fake_text', className: 'fake_text'}));
    var el = ge('fake_text');

    el.innerHTML = '<b>'+art+'</b> - '+title;
    var w = getSize(el)[0];
    if (w > 300) { // if real label length more than 300px
      if (title.length >= 34) title =  title.substr(0,31)+'...';
      el.innerHTML = ' - '+title;
      var diff = 300 - getSize(el)[0];
      el.innerHTML = '<b>'+art+'</b>';
      var art_w = getSize(el)[0];
      if (diff < art_w) {
        var l = Math.floor(art.length * diff / art_w);
        art = art.substr(0, l)+'...';
        el.innerHTML = '<b>'+art+'...</b>';
        while (getSize(el)[0] > diff) {
          art = art.substr(0, art.length - 1);
          el.innerHTML = '<b>'+art+'...</b>';
        }
        art += '...';
      }
    }
    art = art.replace(/<|>/g, '');
    title = title.replace(/<|>/g, '');
    re(el);
    ge('gp_audio_info_small').innerHTML = '<div class="title_wrap"><b>'+art+'</b><br/>'+title+'</div>';
    var t = (vk.rtl) ? title+' &ndash; <b>'+art+'</b>' :  '<b>'+art+'</b> &ndash; '+title;
    geByClass1('title_wrap', ge('gp_audio_info_large')).innerHTML = '<div class="fl_l">'+t+'</div><div class="duration fl_r" id="gp_duration" onmousedown="audioPlayer.switchTimeFormat(audioPlayer.id, event);">'+dur+'</div>';
    updGlobalPlayer();
  },
  onError: function(error_msg) {
    var _a = audioPlayer;
    if (_a.id) _a.reloadAudio(_a.id);
    _a.reloadPlaylist();
  },
  onLoadComplete: function(len) {
    if (len) audioPlayer.duration = len;
  },
  onPlayFinish: function() {
    var _a = audioPlayer;
    _a.playbackSent = _a.statusSent = 0;
    var next_id, cur_id = _a.id, m = (cur_id + '').match(/^-?\d+_\d+_s(\d+)$/);
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
            }
            if (_a.id === null) {
              _a.operate(id);
            }
          }
        });
      }
    } else {
      next_id = (window.audioPlaylist) ? audioPlaylist[cur_id]['_next'] : _a.getNextSibling();
    }
    _a.stop();
    if (cur && cur.edit) {
      var dis = _a.gpDisabled;
      if (ge('gp')) toggleGlobalPlayer(false);
      _a.gpDisabled = dis;
      return;
    }
    if (next_id && (_a.repeat || cur_id != next_id)) {
      _a.operate(next_id);
    }
  },
  scrollToTrack: function(nid) {
    var w = window, de = document.documentElement, play_btn = ge('play'+nid);
    if (!w.pageNode || !play_btn || nav.objLoc[0] == 'im') return;
    var xy = getXY(play_btn);
    var dheight = Math.max(intval(w.innerHeight), intval(de.clientHeight));
    var height = Math.max(0, xy[1] - (dheight - 16) / 2);
    scrollToY(height, 400);
  },
  nextTrack: function(no_scroll) {
    var nid, _a = audioPlayer;
    nid = (window.audioPlaylist && audioPlaylist[_a.id]) ? audioPlaylist[_a.id]['_next'] : _a.getNextSibling();
    if (nid) {
      _a.stop();
      _a.operate(nid);
      if (!no_scroll) _a.scrollToTrack(nid);
    }
  },
  prevTrack: function(no_scroll) {
    var pid, _a = audioPlayer;
    pid = (window.audioPlaylist && audioPlaylist[_a.id]) ? audioPlaylist[_a.id]['_prev'] : _a.getPrevSibling();
    if (pid) {
      _a.stop();
      _a.operate(pid);
      if (!no_scroll) _a.scrollToTrack(pid);
    }
  },
  getNextSibling: function() {
    var getAId = function(el){return el && el.id && el.id.substr(0, 5) == 'audio' && parseInt(el.id.substr(5)) ? el.id.substr(5) : 0; }
    var cur=ge('audio'+audioPlayer.id);
    if (!cur) return null;
    var aid = 0;
    for (var el=cur.nextSibling; el; el=el.nextSibling) {
      if (aid = getAId(el)) return aid;
      if (isVisible(el) && (aid = getAId(el.firstChild))) return aid;
    }
    var p = cur.parentNode.nextSibling;
    while (p && p.nodeType != 1 && p.nextSibling) p = p.nextSibling;
    if (p && p.nodeType == 1) {
      var el = geByClass1('audio', p);
      if (aid = getAId(el)) return aid;
    }
    for (p=cur.parentNode.parentNode.firstChild; p; p=p.nextSibling) {
      if (p && p.nodeType == 1 && p != cur.parentNode) {
        var el = geByClass1('audio', p);
        if (aid = getAId(el)) return aid;
      }
    }
    for (var el=cur.parentNode.firstChild; el; el=el.nextSibling) {
      if (aid = getAId(el)) return aid;
    }
  },
  getPrevSibling: function() {
    var getAId = function(el){return el && el.id && el.id.substr(0, 5) == 'audio' && parseInt(el.id.substr(5)) ? el.id.substr(5) : 0; }
    var cur=ge('audio'+audioPlayer.id);
    if (!cur) return null;
    var aid = 0;
    for (var el=cur.previousSibling; el; el=el.previousSibling) {
      if (aid = getAId(el)) return aid;
      if (isVisible(el) && (aid = getAId(el.firstChild))) return aid;
    }
    var p = cur.parentNode.previousSibling;
    while (p && p.nodeType != 1 && p.previousSibling) p = p.previousSibling;
    if (p && p.nodeType == 1) {
      var el = geByClass1('audio', p);
      if (aid = getAId(el)) return aid;
    }
    for (p=cur.parentNode.parentNode.lastChild; p; p=p.previousSibling) {
      if (p && p.nodeType == 1 && p != cur.parentNode) {
        var el = geByClass1('audio', p);
        if (aid = getAId(el)) return aid;
      }
    }
    for (var el=cur.parentNode.lastChild; el; el=el.previousSibling) {
      if (aid = getAId(el)) return aid;
    }
  },
  showCurrentTrack: function() {
    var _a = audioPlayer;
    if (_a.id && _a.player) {
      _a.setGraphics('load');
      if (_a.player.paused()) {
        _a.setGraphics('pause');
      } else {
        _a.setGraphics('play');
      }
      _a.player.callPlayProgress();
      if (_a.player.callLoadProgress) _a.player.callLoadProgress();
    }
  },
  formatTime: function(t) {
    var res, sec, min, hour;
    sec = t % 60;
    res = (sec < 10) ? '0'+sec : sec;
    t = Math.floor(t / 60);
    min = t % 60;
    res = min+':'+res;
    t = Math.floor(t / 60);
    if (t > 0) res = t+':'+res;
    return res;
  },
  setCurTime: function(cur, len) {
    var _a = audioPlayer;
    var t = _a.timeLeft ? len - cur : cur,
        res = _a.formatTime(t);
    var dur = ge('audio'+_a.id) && geByClass1('duration', ge('audio'+_a.id));
    if (dur && res) dur.innerHTML = res;
    if (_a.timeLeft) res = vk.rtl ? res+'-' : '-'+res;
    if (ge('gp_duration') && res) ge('gp_duration').innerHTML = res;
  },
  switchTimeFormat: function(id, event) {
    var _a = audioPlayer;
    if (_a.id != id) return;
    _a.timeLeft = (_a.timeLeft + 1) % 2;
    _a.player.callPlayProgress();
    setCookie('audio_time_left', _a.timeLeft);
    cancelEvent(event);
  },
  onLoadProgress: function(bLoaded, bTotal) {
    var _a = audioPlayer;
    var _row = ge('audio'+_a.id);
    var _gp = ge('gp');
    if (isNaN(bTotal) && _a.player.onCanPlay) bTotal = _a.duration;
    var per=Math.ceil(bLoaded/bTotal*100);
    if (per<0) per=0;
    if (per>100) per=100;
    if (_row) ge('audio_progress_line'+_a.id).style.width=per+'%';
    if (_gp) ge('gp_pr_line').style.width=per+'%';
  },
  onPlayProgress: function(pos, len) {
    var barSize, _a=audioPlayer;
    var _row = ge('audio'+_a.id);
    var _gp = ge('gp');
    if (Math.abs(len-_a.duration)>1 || isNaN(len)) len = _a.duration;
    if (!_a.prClicked) {
      if (_row) {
        barSize = getSize(ge('audio_load_line'+_a.id));
        var curPos = Math.round((barSize[0]-_a.prX)*pos/len);
        if (vk.rtl) curPos = -curPos;
        ge('audio_pr_slider'+_a.id).style.left = curPos+'px';
      }
      if (_gp) {
        var curPos = Math.round((_a.gpSz-_a.prX)*pos/len);
        if (vk.rtl) curPos = -curPos;
        if (_a.id) ge('gp_pr_slider').style.left = curPos+'px';
        else ge('gp_pr_slider').style.left  = '0px';
      }
    }
    _a.setCurTime(Math.round(pos), Math.round(len));
  },
  dragPlayer: function(event) {
    var _a = audioPlayer, _gp = ge('gp'), b = 6;
    if (!_a.clickPos) {
      _a.endDrag();
      return;
    }
    if (event) {
      var diffY = event.clientY - _a.clickPos.y;
      var diffX = event.clientX - _a.clickPos.x;
    } else {
      var diffY = 0;
      var diffX = 0;
    }
    var sticked = 0;
    if (_a.clickPos.t + diffY + _gp.h > _a.layerSize.h - b) {
      diffY = _a.layerSize.h - _a.clickPos.t - _gp.h;
      sticked |= 1;
    }
    if (_a.clickPos.l + diffX + _a.gpMaxW > _a.layerSize.w - b) {
      diffX = _a.layerSize.w - _a.clickPos.l - _a.gpMaxW;
      if (!vk.rtl && !hasClass(_gp, 'reverse')) {
        addClass(_gp, 'reverse');
        _gp.rev = 1;
        ls.set('audio_rev', 1);
      }
      sticked |= 2;
    } else {
      if (!vk.rtl && hasClass(_gp, 'reverse')) {
        removeClass(_gp, 'reverse');
        _gp.rev = null;
        ls.remove('audio_rev');
      }
    }
    if (sticked) {
      ls.set('audio_sticked', sticked);
    } else {
      ls.remove('audio_sticked');
    }
    if (_a.clickPos.t + diffY < b) {
      diffY = -_a.clickPos.t;
    }
    if (_a.clickPos.l + diffX < b) {
      diffX = -_a.clickPos.l;
      if (vk.rtl && !hasClass(_gp, 'reverse')) {
        addClass(_gp, 'reverse');
        _gp.rev = 1;
        ls.set('audio_rev', 1);
      }
    } else {
      if (vk.rtl && hasClass(_gp, 'reverse')) {
        removeClass(_gp, 'reverse');
        _gp.rev = null;
        ls.remove('audio_rev');
      }
    }
    _gp.t = _a.clickPos.t + diffY;
    _gp.l = _a.clickPos.l + diffX;
    setStyle(_gp, {
      top: _gp.t + 'px',
      left: _gp.l + 'px'
    });
    return (event) ? cancelEvent(event) : false;
  },
  startDrag: function(event) {
    var w = window, de = document.documentElement;
    if (event.button && event.button !== 1 || !w.pageNode) {
      return;
    }
    var _a = audioPlayer, _gp = ge('gp'), sbw = sbWidth();
    var dwidth = Math.max(intval(w.innerWidth), intval(de.clientWidth));
    var dheight = Math.max(intval(w.innerHeight), intval(de.clientHeight));
    _a.layerSize = {w: dwidth - sbw * (browser.msie && !browser.msie9 ? 0 : 1) - 1, h: dheight};
    _a.clickPos = {x: event.clientX, y: event.clientY, t: _gp.t, l: _gp.l};
    setStyle(_gp, {cursor: 'move'});
    var cb = function(event) {
      delete _a.clickPos;
      delete _a.layerSize;
      var l = (!vk.rtl != !_gp.rev) ? _gp.l + _a.gpMaxW - _a.gpMinW : _gp.l;
      var newPos = {t: _gp.t, l: l};
      ls.set('audio_pos', newPos);
      _a.pos = newPos;
      setStyle(_gp, {cursor: 'default'});
      removeEvent(document, 'mouseup', cb);
      removeEvent(document, 'mousemove', _a.dragPlayer);
      removeEvent(document, 'drag', _a.dragPlayer);
      expandGlobalPlayer(false);
      return false;
    }
    addEvent(document, 'mouseup', _a.endDrag);
    addEvent(document, 'mousemove', _a.dragPlayer);
    addEvent(document, 'drag', _a.dragPlayer);
    cancelEvent(event);
  },
  endDrag: function(event) {
    var _a = audioPlayer, _gp = ge('gp');
    delete _a.clickPos;
    delete _a.layerSize;
    var l = (!vk.rtl != !_gp.rev) ? _gp.l + _a.gpMaxW - _a.gpMinW : _gp.l;
    var newPos = {t: _gp.t, l: l};
    ls.set('audio_pos', newPos);
    _a.pos = newPos;
    setStyle(_gp, {cursor: 'default'});
    removeEvent(document, 'mouseup', _a.endDrag);
    removeEvent(document, 'mousemove', _a.dragPlayer);
    removeEvent(document, 'drag', _a.dragPlayer);
    expandGlobalPlayer(false);
    var isOnPlayer = function(e) {
      return (e.clientX !== undefined && e.clientY !== undefined && e.clientX >= _gp.l && e.clientX <= _gp.l + _gp.w && e.clientY >= _gp.t && e.clientY <= _gp.t + _gp.h);
    }
    if (window.gp_timer && isOnPlayer(event)) {
      clearTimeout(gp_timer);
      window.gp_timer = null;
    }
    cancelEvent(event);
  },
  addCurrentTrack: function() {
    var _a = audioPlayer;
    if (_a.id && _a.addHash) {
      var ids = _a.id.split('_');
      if (ids.length == 1) {
        ids[1] = ids[0];
        ids[0] = vk.id;
      }
      if (cur.addedIds && cur.addedIds[_a.id] || hasClass(ge('gp_add'), 'added')) return false;
      if (ids && ids[0] && ids[1]) {
        var query = {act: 'add', oid: ids[0], aid: ids[1], hash: _a.addHash};
        if (_a.top) query.top = 1;
        ajax.post('audio', query, {
          onDone: function (data, res, text) {
            if (data && window.Audio && cur.id == vk.id && cur.audiosIndex && cur.audiosList && cur.audiosList['all'] && cur.aSearch) {
              var obj = eval('('+data+')');
              obj = obj['all'][0];
              setTimeout(function(){
                var all_list = cur.audiosList['all'];
                if (all_list && all_list.length) {
                  obj._order = all_list[0]._order - 1;
                  cur.audiosList['all'].splice(0,0,obj);
                } else {
                  obj._order = 0;
                  cur.audiosList['all'] = [obj];
                }
                cur.audios[obj[1]] = obj;
                cur.audiosIndex.add(obj);
                if (cur.curSection == 'all') {
                  cur.ignoreEqual = true;
                  Audio.updateList(null, cur.aSearch, true);
                }
              }, 0);
            }
            if (!cur.addedIds) cur.addedIds = {};
            cur.addedIds[_a.id] = 1;
            addClass(ge('gp_add'), 'added');
            setStyle(geByClass1('add', ge('gp_add')), {opacity: .6});
            showDoneBox(text, {out: 2000});
          }
        });
      }
    }
  },
  highLight: function(el, control, state) {
    var _a = audioPlayer, cond, opacity = state ? 1 : .6;
    switch (control) {
      case 'next':
        cond = (window.audioPlaylist && audioPlaylist[_a.id]) ? audioPlaylist[_a.id]['_next'] : _a.getNextSibling();
        break;
      case 'prev':
        cond = (window.audioPlaylist && audioPlaylist[_a.id]) ? audioPlaylist[_a.id]['_prev'] : _a.getPrevSibling();
        break;
      case 'add':
        cond = !hasClass(el.parentNode, 'added');
        break;
    }
    if (cond || !state) animate(el, {opacity: opacity}, 100);
    return cond;
  }
}

try{stManager.done('new_player.js');}catch(e){}
