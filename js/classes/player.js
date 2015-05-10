var PlayerPlayer = (function(){

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

	var PlayerVimeo = (function(){

		// https://developer.vimeo.com/apis/simple

		var url_info_tpl 	= "http://vimeo.com/api/v2/video/<%= video_id %>.json";
		var url_iframe_tpl  = "http://player.vimeo.com/video/<%= video_id %>?api=1&player_id=<%= iframe_id %>";
		var html_iframe_tpl = "<iframe id=\"<%= iframe_id %>\" class=\"vid-service-player\" src=\"\" allowfullscreen></iframe>";

		var VimeoPlayer = function () {
			if ( '$f' in window ) {

				var self = this;

				_.extend(this, Backbone.Events);

				var vimeo_id = arguments[0];
				var dom_element = $( arguments[1] );

				var iframe_id = "vimeo-iframe-"+vimeo_id;
				var iframe_url = _.template(url_iframe_tpl,{
					video_id: vimeo_id, iframe_id: iframe_id});
				
				var iframe = $(_.template(html_iframe_tpl,{
					iframe_id:iframe_id}));
				var player = self.player = null;

				var state = -1;
				var VM_PLAYING = 0;
				var VM_PAUSED = 1;
				var VM_FINISHED = 1;

				var currentTimeProg = 0;
				var durationProg = 0;

				iframe.load(function(){
					player = self.player = $f( iframe.get(0) );
					player.addEvent('ready',function(){
						
						/* {
						    "percent":"0.326",
						    "bytesLoaded":"32159909",
						    "bytesTotal":"98650027",
						    "duration":"365.507"
						} */
						player.addEvent('loadProgress',function(){

						});

						/* {
							"seconds":"4.308",
							"percent":"0.012",
							"duration":"359.000"
						} */
						player.addEvent('playProgress',function(prog){
							currentTimeProg = parseFloat( prog.seconds );
							durationProg 	= parseFloat( prog.duration );
						});

						player.addEvent('play',function(){
							state = VM_PLAYING;
							self.trigger('player:playing');
						});
						
						player.addEvent('pause',function(){
							state = VM_PAUSED;
							self.trigger('player:paused');
						});

						player.addEvent('finish',function(){
							state = VM_FINISHED;
							self.trigger('player:finished');
						});

						/*{
						    "seconds":"192.622",
						    "percent":"0.527",
						    "duration":"365.507"
						}*/
						player.addEvent('seek',function(prog){
							// seconds get floored to int
							// currentTimeProg = parseFloat( prog.seconds );
							// durationProg 	= parseFloat( prog.duration );
						});

						_.extend( self, PlayerApiImpl );
					});
				});

				iframe.attr('src',iframe_url);

				dom_element.append( iframe );

			} else {
				throw( 'VimeoPlayer: froogaloop not loaded' );
			}

			// https://developer.vimeo.com/player/js-api

			var PlayerApiImpl = 
				_.extend( PlayerAPI, {

				play : function () {
					self.player.api('play');
				},
				pause : function () {
					self.player.api('pause');
				},
				stop : function () {
					self.player.api('pause');
					self.currentTime(0);
				},
				playing : function () {
					return state === VM_PLAYING;
				},
				paused : function () {
					return state === VM_PAUSED;
				},
				currentTime : function ( seconds ) {
					if ( seconds ) {
						// seekTo can only jump to full seconds, not ms
						self.player.api('seekTo',seconds);
						if ( seconds >= 0 && seconds <= self.duration() )
							return seconds;
					}
					return currentTimeProg;
				},

				mute : function ( yesno ) {
					self.player.api('setVolume',0);
				},
				muted : function () {
					return self.volume() === 0;
				},
				volume : function ( volume ) {
					if ( volume ) {
						self.player.api('setVolume', volume );
					}
					return self.player.api('getVolume');
				},

				load : function ( videoId, targetElement, callback ) {
				},
				title : function () {
				},
				duration : function () {
					//return self.player.api('getDuration');
					return durationProg;
				},
				size : function () {
					return {
						width: self.player.api('getVideoWidth'),
						height: self.player.api('getVideoHeight')
					};
				},
				url : function () {
					return self.player.api('getVideoUrl');
				},
				service : function () {
					return 'Vimeo';
				}

			});
		}

		return VimeoPlayer;

	})(); /* PlayerVimeo */

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

					player = new YT.Player(
						dom_element, { 
							width: $(dom_element).width()+'px',
							height: 270+'px',
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
						var state = (arguments && arguments[0] && arguments[0].data) ? arguments[0].data : -1;
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
							if ( state === YT.PlayerState.PLAYING ) {
								self.trigger( 'player:playing' );
								self.trigger( 'player:time-change', self.currentTime() );
								poller.start();
							} else if ( state === YT.PlayerState.PAUSED ) {
								self.trigger( 'player:paused' );
								poller.stop();
							} else if ( state === YT.PlayerState.CUED ) {
								//iframe = $('iframe',dom_element);
							} else if ( state === YT.PlayerState.ENDED ) {
								poller.stop();
							} else if ( state === YT.PlayerState.BUFFERING ) {
								poller.stop();
							} else {
								poller.stop();
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
					throw( 'YouTubePlayer: Not enough arguments for' );
				}
			} else {
				//console.log( YT, 'YT' in window );
				throw( 'YouTubePlayer: Native Goole YouTube player API not available' );
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

	var PlayerHTML5 = (function(){
		var HTML5Player = function(){
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
		return HTML5Player;
	})();

	return {
		HTML5 : PlayerHTML5,
		Vimeo : PlayerVimeo,
		YouTube : PlayerYouTube
	};

})();