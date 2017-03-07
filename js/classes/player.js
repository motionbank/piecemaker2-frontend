var PlayerPlayer = (function(){

	/** --------------------------------------------------------
	 *	API
	 * ------------------------------------------------------ */
	var PlayerAPI = {

		// ##Controlling video playback
				
		play : function () {
		},
		pause : function () {
		},
		stop : function () {
		},
		playing : function () {
		},
		paused : function () {
		},
		currentTime : function ( seconds ) {
		},
		fps : function () {
			return 25.0;
		},

		/*loop : function ( yesno ) {
		},*/
		/*speed : function ( speed ) {
		},
		quality : function ( quality ) {
		},*/

		// ##Working with playlists

		// ##Controlling video sound settings

		mute : function ( yesno ) {
		},
		muted : function () {
		},
		volume : function ( volume ) {
		},

		// ##Video information

		load : function ( videoId, targetElement, callback ) {
		},
		// unload: function () {
		// },
		// destroy : function () {
		// },
		title : function () {
		},
		duration : function () {
		},
		size : function () {
		},
		url : function () {
		},
		service : function () {
		},

		/*qualities : function () {
		},
		speeds : function () {
		},*/
	}; /* PlayerAPI */


	/** --------------------------------------------------------
	 *	FlowPlayer
	 * ------------------------------------------------------ */
	var PlayerFlowPlayer = (function(){

		var html_tpl = "<div class=\"flowplayer-container\"></div>";

		var types = {
			'mp4' : 'video/mp4', 
			'ogv' : 'video/ogg',
			'webm' : 'video/webm',
			'flash' : 'video/flash'
		};
		
		if ( !( 'flowplayer' in window ) ) {
			$(document.head).append('<script src="lib/flowplayer-5.4.3/flowplayer.min.js"></script>');
		}
		$(document.head).append('<link href="lib/flowplayer-5.4.3/skin/minimalist.css" type="text/css" rel="stylesheet"/>');

		var FlowplayerPlayer = function () {

			var self = this;

			_.extend(this, Backbone.Events);

			if ( !( 'flowplayer' in window ) ) {
				throw( 'Flowplayer missing!' );
			}

			var video_path = arguments[0];

			var $parent = $( arguments[1] );
			
			var config = {
				file_host : 'http://motionbank-media.s3.amazonaws.com',
				base_url : 'dh/piecemaker',
				streamer : 's12vlv7g59gljg.cloudfront.net'
			};

			var video_urls = [];

			// if ( config.local ) {
			// 	video_urls.push({ mp4   : window.location.href.replace(/#.*$/,'').replace(/\/[^\/]*$/,'') + '/video/' + video_name + '.mp4' });
			// } else {
				video_urls.push({ mp4   : video_path });
				// video_urls.push({ mp4   : config.file_host + '/' + config.base_url + '/' + video_name + '.mp4' });
				// video_urls.push({ ogg   : config.file_host + '/' + config.base_url + '/' + video_name + '.ogv' });
				// video_urls.push({ webm  : config.file_host + '/' + config.base_url + '/' + video_name + '.webm'});
				// video_urls.push({ flash : 'mp4:' + config.base_url + '/' + video_name });
			// }

			var $element = $( html_tpl );

			var setPlayerSize = function () {

				var vw = player.video.width;
				var vh = player.video.height;
				var dw = $parent.width();
				var dh = $parent.height();

				var vr = vw/vh;
				var dr = dw/dh;
				if ( dr >= vr ) {
					vw = parseInt( Math.round( vr * dh ) );
					vh = dh;
				} else {
					vh = parseInt( Math.round( dw / vr ) );
					vw = dw;
				}
				
				var css_settings = {
					left: ((dw-vw) / 2) + 'px',
						//top: ((dh-vh) / 2) + 'px',
					top: '0px',
					width: vw + 'px',
					height: vh + 'px'
				};
				$element.css(css_settings);
			}

			$element.flowplayer({
				playlist : [ video_urls ],
				engine : 'flash',
				swf : 'lib/flowplayer-5.4.3/flowplayer.swf',
				rtmp : 'rtmp://'+config.streamer+'/cfx/st',
				poster : false
			}).appendTo( $parent );

			var player = self.player = flowplayer( $element );

			player.bind('load',function(){
				// not fired?
			});
			player.bind('ready',function(){
				_.extend(self,PlayerApiImpl);
				//setPlayerSize();
			});
			player.bind('error',function(){
				console.log( 'Error occured!', arguments );
			});
			player.bind('progress',function(){
				player_time = player.video.time;
				self.trigger( 'player:time-change', player.video.time );
			});
			player.bind('volume',function(){
				player_volume = arguments[2];
			});
			player.bind('play',function(){
				self.trigger('player:playing');
			})

			var player_speed = 1, player_muted = false, player_volume = 1, player_time = 0;

			var PlayerApiImpl = 
				_.extend( PlayerAPI, {
							
				play : function () {
					player.play();
				},
				pause : function () {
					player.pause();
				},
				stop : function () {
					player.stop();
				},
				currentTime : function ( sec ) {
					if ( sec !== undefined ) {
						player.seek( sec, function(){
							player_time = sec;
							self.trigger('player:time-change',player_time); // sometimes triggered twice!
						});
					} else {
						return player_time;
					};
				},
				fps : function () {
					return 1.0 * (video_dat.fps || 25);
				},
				playing : function () {
					return this.state === YT.PlayerState.PLAYING;
				},
				paused : function () {
					return this.state === YT.PlayerState.PAUSED;
				},
				speed : function ( val ) {
					if ( val !== undefined ) {
						player.setPlaybackRate( val );
					}
					return player.getPlaybackRate();
				},
				speeds : function () {
					return player.getAvailablePlaybackRates();
				},
				quality : function ( q ) {
					var qualities = player.getAvailableQualityLevels();
					if ( q && qualities.indexOf(q) !== -1 ) {
						player.speed( q, function () {
							player_speed = q;
						});
					}
					return player_speed;
				},
				qualities : function () {
					return null;
				},

				// playlists

				// controlling sound

				mute : function ( set ) {
					player.mute( set ? true : false, function (s) {
						console.log( 'Mute state', s );
						player_muted = (set ? true : false);
					});
				},
				muted : function () {
					return player_muted;
				},
				volume : function ( val ) {
					if ( val !== undefined ) {
						var v = val < 0 ? 0 : (val > 1 ? 1 : val);
						player.volume( v, function(){
							player_volume = v;
						});
					}
					return player_volume;
				},

				// getting information

				duration : function () {
					return player.video.duration;
				}

			});

		}

		return FlowplayerPlayer;
	})(); /* PlayerFlowPlayer */


	/** --------------------------------------------------------
	 *	Vimeo
	 * ------------------------------------------------------ */
	var PlayerVimeo = (function(){

		// see documentation here:
		// https://github.com/vimeo/player.js

		var html_tpl = `
<div id="<%= vimeo_container_id %>"></div>
`;

		var VimeoPlayer = function () {

			if ( 'Vimeo' in window ) {

				var self = this;

				_.extend(this, Backbone.Events);

				var vimeo_id = arguments[0];
				var video_element = $( arguments[1] );

                // https://github.com/vimeo/player.js#embed-options
                var options = {
                    id: vimeo_id,
                    byline: false,
                    portrait: false,
                    title: false,
                    width: 640,
                    loop: false
                };

                var is_playing = false, is_paused = false;
                var current_volume = 0, video_duration = 0, video_current_time = 0;

                var player = self.player = new Vimeo.Player( video_element, options);

                player.on( 'pause', function(data) {
                	is_paused = true;
                    is_playing = false;
                });
                player.on( 'play', function(data) {
                    is_paused = false;
                    is_playing = true;
                });
                player.on( 'volumechange', function(data) {
                    current_volume = data.volume;
                });
                player.on( 'timeupdate', function(data) {
                    video_current_time = data.seconds;
                    self.trigger( 'player:time-change', data.seconds );
                });
                player.on( 'loaded', function(duration) {
                    player.getDuration().then(function(data){
                    	video_duration = duration;
					});
                    player.getVideoWidth().then(function(width){
                    	video_width = width;
					});
                    player.getVideoWidth().then(function(height){
                    	video_height = height;
					});
                    player.getVideoUrl().then(function(url) {
                    }).catch(function(error) {
                    	if ( error.name === 'PrivacyError' ) {
                    		video_url = null;
						} else {
                    		video_url = url;
						}
                    });

                    _.extend( self, PlayerApiImpl );
                });


			} else {
				throw( 'Vimeo Player not loaded' );
			}

			var PlayerApiImpl = 
				_.extend( PlayerAPI, {

				play : function () {
					self.player.play();
				},
				pause : function () {
					self.player.pause();
				},
				stop : function () {
                    self.player.pause();
					self.player.setCurrentTime(0);
				},
				playing : function () {
					return is_playing;
				},
				paused : function () {
                    return is_paused;
				},
				currentTime : function ( seconds ) {
				    if ( seconds && seconds > 0 ) {
                        self.player.setCurrentTime(seconds);
                    }
					return video_current_time;
				},
				mute : function () {
                    self.player.setVolume(0);
				},
				muted : function () {
					return current_volume <= 0;
				},
				volume : function ( volume ) {
					if ( volume ) {
                        self.player.setVolume( volume );
					}
					return current_volume;
				},
				load : function ( videoId, targetElement, callback ) {
				},
				title : function () {
				},
				duration : function () {
					return video_duration;
				},
				size : function () {
					return {
						width: video_width,
						height: video_height
					};
				},
				url : function () {
					return video_url;
				},
				service : function () {
					return 'Vimeo';
				}
			});
		}

		return VimeoPlayer;

	})(); /* PlayerVimeo */


	/** --------------------------------------------------------
	 *	YouTube
	 * ------------------------------------------------------ */
	var PlayerYouTube = (function(){

		var YouTubePlayer = function () {

			_.extend(this, Backbone.Events);

			var self = this;
			var player = null;
			var state = -1;

			var debug = true;

			if ( 'YT' in window ) {
				if ( arguments.length >= 2 ) {

					var yt_video_id = arguments[0];
					var dom_element = arguments[1];

					var last_poll_ts = -1;
					var poller = new PlayerTimePoller( 1000 / 25, function(){
						var now = self.currentTime();
						if ( last_poll_ts !== now ) {
							last_poll_ts = now;
							self.trigger( 'player:time-change', now );
						}
					});

					// Links:
					// JS Player API http://goo.gl/ZMS4I
					// Iframe API http://goo.gl/JQOT4

					// var iframe = $(_.template(html_iframe_tpl,{
					// 	origin: window.location.origin,
					// 	modestbranding: 1,
					// }));
					// $(dom_element).append(iframe);

					var player_height = $(dom_element).width()
					var player_width = player_height * (9/16.0);

					player = new YT.Player(
						dom_element, { 
							width: player_height+'px',
							height: player_width+'px',
							//videoId: yt_video_id,
							playerVars: {	// http://goo.gl/Bm6Ko
								// controls    : 1,
								// autohide    : 1,
								modestbranding : 1, // less branding
								rel 		   : 0, // show "related" at end off
								disablekb 	   : 1, // disable keyboard shortcuts
								//theme		   : 'light'
								fs 			   : 0, // fullscreenbutton off
								iv_load_policy : 3, // annotations off
								//playerapiid    : 'player_id_'+parseInt(Math.random() * 10000)
							}
						});

					player.addEventListener( 'onError', function () {
						if ( debug ) console.log( arguments );
						throw( 'YouTubePlayer ... error' );
					});

					player.addEventListener( 'onPlaybackQualityChange', function () {
						if ( debug ) console.log( 'YouTubePlayer.onPlaybackQualityChange', arguments );
						var qualities = [
							'small',
							'medium',
							'large',
							'hd720',
							'hd1080',
							'highres'
						];
					});

					player.addEventListener( 'onPlaybackRateChange', function () {
						if ( debug ) console.log( 'YouTubePlayer.onPlaybackRateChange', arguments );
					});

					player.addEventListener( 'onStateChange', function () {

						if ( debug ) console.log( 'YouTubePlayer.onStateChange', arguments );
						var state = (arguments[0] && arguments[0].data) ? arguments[0].data : -1;
						var states = [
							-1, // unstarted
							YT.PlayerState.ENDED,
							YT.PlayerState.PLAYING,
							YT.PlayerState.PAUSED,
							YT.PlayerState.BUFFERING,
							YT.PlayerState.CUED
						];
						if ( states.indexOf( state ) !== -1 ) {
							self.state = state;
							poller.start();
							if ( state === YT.PlayerState.PLAYING ) {
								self.trigger( 'player:playing' );
								self.trigger( 'player:time-change', self.currentTime() );
							} else if ( state === YT.PlayerState.PAUSED ) {
								self.trigger( 'player:paused' );
							} else if ( state === YT.PlayerState.CUED ) {
								//iframe = $('iframe',dom_element);
							} else if ( state === YT.PlayerState.ENDED ) {
								poller.stop();
							} else if ( state === YT.PlayerState.BUFFERING ) {
								poller.stop();
							} else {
								poller.stop();
								if ( debug ) console.log( 'YouTubePlayer.onStateChange: other state: ' + state );
							}
						}
					});

					player.addEventListener( 'onApiChange', function () {
						if ( debug ) console.log( 'YouTubePlayer.onApiChange', arguments );
					});

					player.addEventListener( 'onReady', function(){

						player.cueVideoById({
							videoId: yt_video_id,
							startSeconds: 0,
							//endSeconds: XX,
							suggestedQuality: 'large' // 480px, see: http://goo.gl/F1zi5j
						});

						_.extend( self, PlayerApiImpl );

					});

				} else {
					console.log( 'YouTubePlayer: Not enough arguments' );
				}
			} else {
				//console.log( YT, 'YT' in window );
				console.log( 'YouTubePlayer: Native Goole YouTube player API not available' );
			}

			var PlayerApiImpl = 
				_.extend( PlayerAPI, {
							
				// controlling video
				
				play : function () {
					player.playVideo();
				},
				pause : function () {
					player.pauseVideo();
				},
				stop : function () {
					player.stopVideo();
				},
				currentTime : function ( sec ) {
					if ( sec !== undefined ) {
						player.seekTo( sec );
						self.trigger('player:time-change',sec);
					}
					else return player.getCurrentTime();
				},
				playing : function () {
					return this.state === YT.PlayerState.PLAYING;
				},
				paused : function () {
					return this.state === YT.PlayerState.PAUSED;
				},
				speed : function ( val ) {
					if ( val !== undefined ) {
						player.setPlaybackRate( val );
					}
					return player.getPlaybackRate();
				},
				speeds : function () {
					return player.getAvailablePlaybackRates();
				},
				quality : function ( q ) {
					var qualities = player.getAvailableQualityLevels();
					if ( q && qualities.indexOf(q) !== -1 ) {
						player.setPlaybackQuality( q );
					}
					return player.getPlaybackQuality();
				},
				qualities : function () {
					return player.getAvailableQualityLevels();
				},

				// playlists

				// controlling sound

				mute : function ( set ) {
					if ( set === false ) {
						player.unMute();
					} else {
						player.mute();
					}
				},
				muted : function () {
					return player.isMuted();
				},
				volume : function ( val ) {
					if ( val !== undefined ) {
						player.setVolume( val );
					}
					return player.getVolume();
				},

				// getting information

				duration : function () {
					return player.getDuration();
				}

			});
		};

		var PlayerTimePoller = function () {
			
			var self = this;

			var delay = arguments[0];
			var callback = arguments[1];

			var polling = false;
			var ts = -1;

			this.start = function () {
				clearTimeout(ts);
				polling = true;
				self.poll();
			}
			this.poll = function () {
				callback();
				ts = setTimeout(self.poll,delay);
			}
			this.stop = function () {
				clearTimeout(ts);
				polling = false;
			}
		}
		
		return YouTubePlayer;
	})();

	/** --------------------------------------------------------
	 *	HTML5 Video
	 * ------------------------------------------------------ */
	var PlayerHTML5Video = (function(){
		var HTML5PlayerAudio = function(){
			var self = this;
			_.extend(this, Backbone.Events);
			var vid_path = arguments[0];
			var elt = arguments[1];
			var $vid_elt = $('<video src="'+vid_path+'" allowfullscreen controls></video>');
			var video = $vid_elt.get(0);
			video.addEventListener('timeupdate',function(){
				self.trigger( 'player:time-change', video.currentTime );
			});
			$('#video-content').empty().append($vid_elt);
			_.extend(this, PlayerAPI);
			_.extend(this,{
				play : function () {
					video.play();
				},
				pause : function () {
					video.pause();
				},
				stop : function () {
					video.stop();
				},
				currentTime : function ( seconds ) {
					if (seconds) {
						video.currentTime = seconds;
						self.trigger('player:time-change',video.currentTime);
					}
					return video.currentTime;
				},
				duration : function () {
					return video.duration;
				},
				size : function () {
					return {
						width: video.width,
						height: video.height
					}
				},
			});
		};
		return HTML5PlayerAudio;
	})();

	/** --------------------------------------------------------
	 *	HTML5 Audio
	 * ------------------------------------------------------ */
	var PlayerHTML5Audio = (function(){
		var HTML5PlayerAudio = function(){
			var self = this;
			_.extend(this, Backbone.Events);
			var src_path = arguments[0];
			var elt = arguments[1];
			var $elt = $('<audio src="'+src_path+'" controls></audio>');
			var audio = $elt.get(0);
			audio.addEventListener('timeupdate',function(){
				self.trigger( 'player:time-change', audio.currentTime );
			});
			$('#video-content').empty().append($elt);
			_.extend(this, PlayerAPI);
			_.extend(this,{
				play : function () {
					audio.play();
				},
				pause : function () {
					audio.pause();
				},
				stop : function () {
					audio.stop();
				},
				currentTime : function ( seconds ) {
					if (seconds) {
						audio.currentTime = seconds;
						self.trigger('player:time-change',audio.currentTime);
					}
					return audio.currentTime;
				},
				duration : function () {
					return audio.duration;
				},
				size : function () {
					return {
						width: audio.width,
						height: audio.height
					}
				},
			});
		};
		return HTML5PlayerAudio;
	})();

	return {
		HTML5 : 	 PlayerHTML5Video,
		HTML5Video : PlayerHTML5Video,
		HTML5Audio : PlayerHTML5Audio,
		Vimeo : 	 PlayerVimeo,
		YouTube : 	 PlayerYouTube
	};

})();