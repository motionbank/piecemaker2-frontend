/*
 * Overview
 *
 * group_id:                    int
 * partials:                    cached partials html
 * active_event:                cached active event object 
 * video:                       cached video element
 * tmp:                         temporary var to store html snippets
 * id:                          id of the wrapper (<div>)
 * render:                      initial render function
 * check_list_placeholder:      helper function
 * get_selected_events_count:   helper function
 * make_first_item_active:      helper function
 * sort_events_list:            helper function
 * events:                      bind UI interactions
 * event_save:                  function for UI interaction
 * events_show_all:             function for UI interaction
 * toggle_filter_bubble:        function for UI interaction 
 * events_filter:               function for UI interaction
 * event_update:                function for UI interaction
 * event_delete:                function for UI interaction
 * event_go_to_timestamp:       function for UI interaction
 * group_toggle_details:        function for UI interaction
 * change_event_type:           function for UI interaction
 *
 */

directory.GroupsDetailView = Backbone.View.extend({

    group_id: null,
    partials: null,
    active_event: null,
    player: null,
    tmp: null,
    id: 'content-inner',
    tags: [],
    active_tags: [],

    context_event_types : [ 'group_movie', 'video', 'movie' ],

    context_event : null,
    time_reference : null,      // a Date reference, for example utc_timestamp of a movie

    initialize : function ( opts ) {
        this.group_id = opts.group_id;
        if ( opts.context_event_id ) this.context_event_id = opts.context_event_id;
    },

    render:function () {
        
        // store template and obj globally
        var el = this.el;
        var self = this;
        var template = this.template();

        // save object vars
        var data = {
            event_count: 0,
            time_now : new Date().getTime()
        };

        // get partial: list element
        var $template = $(template);

        // define mustache partial
        this.partials = {
            "list" :         $('.events-list-content ul li:nth-child(1)',$template)[0].outerHTML,
            'select_media' : $('#select-local-media',$template)[0].outerHTML,
            'update_event' : $('#form-event-update',$template).get(0).innerHTML
        };

        // store the id of the group
        var group_id = this.group_id;

        // get group details and render html
        API.getGroup( group_id, function(group) {
            $.extend(data,{group:group});
        });

        // get event types from group
        API.listEventTypes( group_id, function( types ){
            $.extend(types,["scene","marker","note","comment","video"]);
            types = types.sort();
            $.extend(data,{event_types:types});
        });

        // render template when all ajax requests are finished
        // render it only once at initialization; prevent rendering everytime an ajax call stops
        $(document).one('ajaxStop', function() {

            //console.log( 'Ajax Stop' );

            // render template
            $(el).html(Mustache.render(template,data));

            if ( !('PiecemakerBridge' in window) ) {
                $('.tab.active').removeClass('active');
                $('.tab.app-only').hide();
                $('.tab').not('.app-only').first().addClass('active');
                $('.tab-content.app-only').hide();
            }

            $('.group-video-add .tab-container').easytabs({
                animate: false
            });

            $('.group-video-content').hide();
            $('#event-create-form').hide();

            // set focus to form field
            $('textarea').focus();

            // enable window resizing
            self.$('.wrapper-left').resizable({
                minWidth: 300,
                autoHide: true,
                handles: "e", // disable vertical resize
                start: function(){
                    // close filer bubble
                    $('.bubble').removeClass('bubble-open');
                }
            });

            // enable nice styled select boxes
            $('select').chosen({
                disable_search_threshold: 10, // enable search only if there are more than 10 entries
                width: "100%"
            });

            if ( self.context_event_id ) {

                API.getEvent( group_id, self.context_event_id, function (res) {

                    if ( res && 
                         res.id == self.context_event_id && 
                         self.context_event_types.indexOf(res.type) >= 0 ) {

                        self.set_context_event(res);
                        self.events_show_all();

                    } else {

                        console.log( 'Unable to set context movie' );
                    }
                });

            } else {

                API.listEventsOfType( group_id, 'group_movie', function(res) {

                    // any group videos available?
                    if ( res.length > 0 ) {

                        self.update_event_list( res );
                        //self.set_context_event(res[0]);

                    } else {

                        $('.group-video-content').hide();
                        $('#event-create-form').hide();

                    }

                });
            }

        });
    },

    set_context_event : function ( current_movie ) {

        var self = this;

        self.context_event = current_movie;
        self.time_reference = new Date( current_movie.utc_timestamp.getTime() );

        $('.group-video-add').hide();
        $('.group-video-content').show();
        $('#event-create-form').show();

        var movie_path = current_movie.fields.movie_path || 
                         current_movie.fields['local-file'] || 
                         (current_movie.fields.title + '.mp4');

        if ( !current_movie.fields['local-file'] && 
             current_movie.fields.vid_service ) {
            var vidService = current_movie.fields.vid_service;
            if ( vidService == 'youtube' ) {
                self.player = new PlayerPlayer.YouTube(
                    current_movie.fields.vid_service_id,
                    $('#video-content').get(0)
                );
            }
        } else if ( 'config' in window && config.media ) {
            self.player = new PlayerPlayer.HTML5(
                'http://' + config.media.host + config.media.base_url + '/' + movie_path,
                $('#video-content').get(0)
            );
            // $('.group-video-content').find('video').attr({
            //     src: 'http://' + config.media.host + config.media.base_url + '/' + movie_path
            // });
        }

        var $items = $('.items');

        var end_time;

        var fixDuration = function(){
            if ( self.context_event.duration == 0 && self.player.duration() ) {
                self.context_event.duration = self.player.duration();
                API.getEvent( self.group_id, self.context_event.id, function ( evt ) {
                    API.updateEvent( self.group_id, self.context_event.id, {
                        duration: self.context_event.duration,
                        utc_timestamp: evt.utc_timestamp,
                        token: evt.token
                    }, function ( updt_evt ) {
                        self.context_event = updt_evt;
                    });
                });
            }
            fixDuration = undefined;
        };

        // add active class to events while playing 
        self.player.on('player:time-change',function(){
            if (fixDuration) fixDuration();
            self.active_event = $items.find('li.active');
            var $active = self.active_event;
            var current_time = self.player.currentTime(); 

            // update timestamp on input field while playing video                    
            self.$('#video-time').val(current_time);

            $active.removeClass('active');
            $items.find('li').slice(2).filter(function() {

                var range_min = $(this).data('timestamp');
                var range_max = $(this).next().data('timestamp');
                
                if (range_max == null) {  
                    range_max = end_time;                            
                } 
                
                return current_time >= range_min && current_time < range_max;
                
            }).addClass('active');
            
            // fix for last item at video end
            if (current_time == end_time) {
                $items.find('li:last-child').addClass('active');
            }
        });

        // set video time on input change
        // self.$('#video-time').bind('input', function(){
        //     self.video.currentTime = parseFloat($(this).val());
        // });

        var video_controller = {
            'video-go-to-beginning':     function(e){self.player.currentTime(0);return false},
            'video-step-back-second':    function(e){self.player.currentTime(self.player.currentTime()-1);return false},
            'video-step-back-frame':     function(e){self.player.currentTime(self.player.currentTime()-(1/25.0));return false},
            'video-step-forward-frame':  function(e){self.player.currentTime(self.player.currentTime()+(1/25.0));return false},
            'video-step-forward-second': function(e){self.player.currentTime(self.player.currentTime()+1);return false},
            'video-go-to-end':           function(e){self.player.currentTime(1000000000);return false}
        };

        for ( var k in video_controller ) {
            $('a.'+k).click(video_controller[k]);
        }
    },

    check_list_placeholder: function() {

        // get count of list items
        var l = $('.items').find('li').length;

        // if there are 2 items, show the placeholder
        // item 1: hidden partial
        // item: 2 placeholder
        if (l == 2) {
            $('.list-placeholder').show();

        // if there are more than 2 items, hide placeholder
        } else if (l > 2) {
            $('.list-placeholder').hide();
        }
    },

    get_selected_events_count: function() {

        // get count of list items and substract 2, cause the first two doesn't contain event content
        var l = $('.items').find('li').length - 2;
        $('.counter-selected').text(l);
    },
    
    make_first_item_active: function() {
        
        // get 3rd child, cause first two are helper items 
        $('.items').find('li:nth-child(3)').addClass('active');
    }, 
    
    sort_events_list: function() {

        var $events_list = $('.events-list');
        var $list = $events_list.find('ul');  
        
        // sort by timestamp
        var arr = [].slice.call($events_list.find('.item').not(':first-child')).sort(function (a, b) {
            return parseFloat($(a).data('timestamp')) > parseFloat($(b).data('timestamp')) ? 1 : -1;
        });

        arr.forEach(function (p) {
            $list.append(p);
        });    
    },

    events: {
        "submit .event-create-form":        "event_save",

        "click .events-show-all":           "events_show_all",
        "click .events-show-context":       "events_show_context",
        "click .events-show-user":          "events_show_user",
        "click .toggle-filter-bubble":      "toggle_filter_bubble",
        "click .toggle-tag-filter":         "toggle_tag_filter",
        "click .events-filter":             "events_filter",
        "click .events-load-type":          "events_load_type",
        "click .event-update":              "event_update",
        "click .event-update-save":         "event_update_save",
        "click .event-update-cancel":       "event_update_cancel",
        "click .event-delete":              "event_delete",
        "click .event-go-to-timestamp":     "event_go_to_timestamp",
        "click .group-edit-users":          function(){ directory.router.navigate('#/groups/'+this.group_id+'/users', false); return false; },
        "click .group-toggle-details":      "group_toggle_details",

        'change select[name=event-type]':   'change_event_type',
        'change .chosen-select':            'change_add_file',

        "click .event-set-in":              "event_set_in",
        "click .event-set-out":             "event_set_out",

        'click #event-start-recording':     'start_recording',
        'click #event-add-local-media':     'add_local_media',

        'submit form.add-remote-media-form': 'add_remote_media',

        'exit .bubble': function(){ console.log('leave'); }
    },

    change_add_file : function (e) {

        var self = this;
        var movie_file = $(e.target).val();

        var m_timestamp = self.timestamp_from_movie_path( movie_file );
        if ( m_timestamp == null ) {
            m_timestamp = new Date();
        }

        $('.add-local-media-form input[name=utc_timestamp]').val( m_timestamp.getTime() / 1000.0 );
    },

    start_recording : function (e) {

        var self = this;
        var $el = $(e.target);

        if ( 'PiecemakerBridge' in window ) {
            var file_path = PiecemakerBridge.recorder('start');
            if ( file_path && /.*[0-9]\.mp4$/.test(file_path) ) {
                var file_timestamp = new Date().getTime();
                var f_ts = self.timestamp_from_movie_path( file_path );
                if ( f_ts !== null ) {
                    file_timestamp = f_ts;
                }

                API.createEvent( self.group_id, {
                    type : 'group_movie',
                    utc_timestamp : file_timestamp,
                    fields : {
                        movie_path : file_path
                    }
                }, function (mov) {
                    directory.router.navigate('#/groups/'+self.group_id+'/context/'+mov.id, true);
                });
            }
            return false;
        } else {
        }
    },

    add_local_media : function () {

        var self = this;
        var _partials = self.partials;

        var $ms = $('<div class="media-source" />');
        $('#tab-add-local-media .media-source').remove();

        if ( 'PiecemakerBridge' in window ) {

            var local_media = PiecemakerBridge.recorder("fetch").split(";");

            if ( local_media.length > 0 ) {

                // TODO: filter out already linked videos

                var $select_container = $( Mustache.render(_partials.select_media,local_media) );
                var $select_list = $('select',$select_container);
                
                $select_list.chosen({width:'100%'});
                $select_container.show();
                
                $( 'button', $select_container ).bind('click',function(e){
                    
                    var file_path = $select_list.val();
                    var form = $(e.target).closest('form');
                    var file_timestamp = new Date( $( 'input[name=utc_timestamp]', form ).val() * 1000.0 );

                    if ( file_timestamp ) {
                        API.createEvent( self.group_id, {
                            type : 'group_movie',
                            utc_timestamp : file_timestamp,
                            fields : {
                                movie_path : file_path
                            }
                        }, function (mov) {
                            directory.router.navigate('#/groups/'+self.group_id, true);
                        });
                    } else {
                        console.log( 'UTC timestamp seems to be wrong:', file_timestamp );
                    }

                    return false;
                });
                
                $ms.append($select_container);
            }

        } else {

            $ms.append('Drop file here');
        }

        $('#tab-add-local-media').append($ms);
        $('#tab-add-local-media').show();

        return false;
    },

    add_remote_media : function ( evt ) {

        var self = this;

        var $form = $(evt.currentTarget);
        var urlRaw = $('input[name=video-url]',$form).val();
        var timeStamp = $('input[name=utc_timestamp]',$form).val();
        if ( timeStamp == "" || timeStamp == 0 || timeStamp == -1 ) {
            timeStamp = new Date().getTime();
        } else {
            timeStamp = new Date( parseInt( timeStamp, 10 ) ).getTime();
        }

        if ( !isNaN(timeStamp) && /^http[s]:\/\//.test(urlRaw) ) {

            var videoUri = URI(urlRaw);
            var videoParams = videoUri.search(true);
            var videoID, vidService, title;

            if ( videoUri.host().toLowerCase().indexOf('youtube.com') >= 0 ) {
                videoID = videoParams.v;
                var api_key = "AIzaSyCqZ2A4ecD3F5rmWP7jKQj0-6yqTjsp2zo";
                var parts = ["snippet", "contentDetails", "fileDetails", "player", "processingDetails", "recordingDetails", "statistics", "status", "suggestions", "topicDetails"];
                $.ajax({
                    method: 'get',
                    url: "https://www.googleapis.com/youtube/v3/videos?id="+videoID+"&key="+api_key+"&part=contentDetails,snippet,status",
                    success: function (res, status, evt) {
                        if ( res && res.items && res.items.length > 0 ) {
                            var video_data = res.items[0];
                            if ( video_data.status.embeddable == false ) {
                                alert('Sorry, this one can\'t be embedded');
                                return;
                            }
                            // https://en.wikipedia.org/wiki/ISO_8601#Durations
                            var parseISO8601Duration = function parseISO8601Duration ( str ) {
                                var mins = str.replace(/^P.*[^0-9]+([0-9]+)M.*/g,'$1');
                                if ( mins == str ) mins = 0;
                                var secs = str.replace(/^P.*[^0-9]+([0-9]+)S.*/g,'$1');
                                if ( secs == str ) secs = 0;
                                return parseInt( mins, 10 ) * 60 + parseInt( secs, 10 );
                            };
                            var dur = parseISO8601Duration(video_data.contentDetails.duration);
                            API.createEvent(
                                self.group_id, {
                                    type : 'video',
                                    utc_timestamp : timeStamp,
                                    duration : dur,
                                    fields : {
                                        title : video_data.snippet.title,
                                        vid_service : 'youtube',
                                        vid_service_id : video_data.id
                                    }
                                }, function ( evt ) {
                                    directory.router.navigate('#/groups/'+self.group_id+'/context/'+evt.id, true);
                                }
                            );
                        }
                    }
                });
                vidService = 'youtube';
                title = "Youtube video " + videoID;
            }

            // if ( videoID ) {
            //     API.createEvent(
            //         self.group_id, {
            //             type : 'video',
            //             utc_timestamp : timeStamp,
            //             fields : {
            //                 title : title,
            //                 vid_service : vidService,
            //                 vid_service_id : videoID
            //             }
            //         }, function ( evt ) {
            //             directory.router.navigate('#/groups/'+self.group_id+'/context/'+evt.id, true);
            //         }
            //     );
            // }
        }

        return false;
    },

    timestamp_from_movie_path : function ( movie_path ) {
        if ( movie_path && /.*[\/]*[0-9]+\.[0-9]+\.(mp4|mov)$/i.test(movie_path) ) {
            var movie_ts = movie_path.replace(/^(.+[^0-9])?([0-9]{10}\.[0-9]+)\.(mp4|mov)$/i,'$2');
            movie_ts = parseFloat(movie_ts);
            if ( !isNaN(movie_ts) ) {
                var movie_date_new = new Date( movie_ts * 1000 );
                if ( !isNaN(movie_date_new.getTime()) ) {
                    return movie_date_new;
                }
            }
        }
        return null;
    },

    event_save: function ( evt ) {

        evt.preventDefault();

        var self = this;
        var _partials = this.partials;

        // store form object
        var $form = $( evt.currentTarget );

        // get additional fields
        var fields = {
            description: $form.find('textarea').val()
        };

        // get type of event
        var type = $form.find('*[name="event-type"]').val();

        if ( type == "video" ) {
            fields['local-file'] = fields.description;
            fields.title = fields.description;
        }

        // get timestamp of video
        var timestamp = $('input[name="video-time"]').val();
        if ( self.player ) {
            var ts = self.player.currentTime();
            if ( !isNaN(ts) ) {
                timestamp = ts;
            }
        }

        $.extend(fields,{'movie_timestamp':timestamp});

        if ( type == 'movie' ) {
            var movie_fields = {
                'movie_description' : $form.find('input[name="movie_description"]').val(),
                'movie_path' :        $form.find('input[name="movie_path"]').val()
            };

            $.extend( fields, movie_fields );
        }

        if ( self.context_event && self.context_event.id ) {
            fields['context_event_id']   = self.context_event.id;
            fields['context_event_type'] = self.context_event.type;
        }

        fields['created_by_user_id'] = directory.user.id;

        // store data
        var data = {
            utc_timestamp: self.get_timestamp_now(),
            type: type,
            fields: fields
        };

        API.createEvent( this.group_id, data, function(res){

            // update event counter
            // var $counter = $('.counter-total');
            // $counter.text(parseInt($counter.text()) + 1);

            // show new event after active item
            var content = self.render_event(res);
            $('.events-list').find('ul').append(content);

            self.sort_events_list();
            self.check_list_placeholder();
            self.get_selected_events_count();

            // reset form
            $('.event-create-form')[0].reset();

        });

        return false;
    },

    get_movie_time : function () {
        
        var self = this, mt = 0.0;

        if ( self.player.duration() ) {

            mt = $('input[name="video-time"]').val();
            mt = ((mt && +(mt)) || 0.0) * 1000.0;

        } else if ( /* self.video.currentSrc && */ this.time_reference ) {

            // we have a video with no duration and a time ref, 
            // let's assume recording mode

            mt = Date.now() - this.time_reference.getTime();
        }

        return mt;
    },

    // returns either Date.now() or a time relative to the currently being viewed material
    get_timestamp_now : function () {

        if ( this.time_reference && this.time_reference !== null ) {
            var d = new Date( this.time_reference.getTime() + this.get_movie_time() );
            return d;
        }
        return Date.now();
    },

    events_show_user : function() {

        var self = this;
        var _partials = this.partials;

        if ( self.context_event ) {

            var context_to = undefined;
            if ( self.context_event.duration > 0 ) {
                context_to = (self.context_event.utc_timestamp.getTime() / 1000.0) + self.context_event.duration;
            }

            API.findEvents(
                self.group_id,
                {
                  from: self.context_event.utc_timestamp.getTime() / 1000.0,
                  to: context_to,
                  fields: {
                    context_event_id: self.context_event.id,
                    created_by_user_id: directory.user.id,
                  }
                },
                function(res) {
                    self.update_event_list( res );
                }
            );

        } else {

            API.listEvents( self.group_id, function(res) {

                self.update_event_list( res );
            });
        }

        return false;
    },

    events_show_context : function() {

        var self = this;
        var _partials = this.partials;

        if ( self.context_event ) {

            var context_to = undefined;
            if ( self.context_event.duration > 0 ) {
                context_to = (self.context_event.utc_timestamp.getTime() / 1000.0) + self.context_event.duration;
            }

            API.findEvents(
                self.group_id,
                { from: self.context_event.utc_timestamp.getTime() / 1000.0,
                  to: context_to,
                  fields: {
                    context_event_id: self.context_event.id
                  }
                },
                function(res) {
                    self.update_event_list( res );
                }
            );

        } else {

            API.listEvents( self.group_id, function(res) {

                self.update_event_list( res );
            });
        }

        return false;
    },

    events_show_all : function() {

        var self = this;
        var _partials = this.partials;

        if ( self.context_event ) {

            if ( self.context_event.duration > 0 ) {
                API.listEventsForTimespan(
                    self.group_id, 
                    self.context_event.utc_timestamp.getTime() / 1000.0,
                    (self.context_event.utc_timestamp.getTime() / 1000.0) + self.context_event.duration ,
                    'intersect',
                    function(res) {
                        self.update_event_list( res );
                    });
            } else {
                API.listEventsForTimespan(
                    self.group_id, 
                    self.context_event.utc_timestamp.getTime() / 1000.0,
                    undefined,
                    'intersect',
                    function(res) {
                        self.update_event_list( res );
                    });
            }

        } else {

            API.listEvents( self.group_id, function(res) {

                self.update_event_list( res );
            });
        }

        return false;
    },

    update_event_list : function ( events ) {

        var self = this;
        var _partials = self.partials;

        var $events_list = $('.events-list');
        var $list = $events_list.find('ul');
        
        $events_list.find('.item').not(':first-child').remove();

        self.tags = [];

        // list events
        var events_html = "";
        $.each( events, function(index,value) {
            events_html += self.render_event( value );
        });
        $list.append(events_html);

        self.sort_events_list();
        self.check_list_placeholder();
        self.get_selected_events_count();
        self.make_first_item_active();

    },

    render_event : function ( evnt ) {

        var self = this;

        evnt.is_context_event = self.context_event_types.indexOf(evnt.type) >= 0;
        evnt.is_current_context_event = self.context_event && self.context_event.id == evnt.id;
        evnt.utc_timestamp_float = evnt.utc_timestamp.getTime();

        evnt.tags = [];
        if ( evnt.fields.tags ) {
            var tags = evnt.fields.tags.split(",");
            $.each(tags,function(i,t){
                t = t.replace(/^[\s]+/,'').replace(/[\s]+$/,'');
                if ( self.tags.indexOf(t) < 0 ) {
                    self.tags.push(t);
                }
                evnt.tags.push('tag-'+t);
            });
        }

        return Mustache.render( self.partials.list, evnt );
    },

    toggle_filter_bubble: function() {
        
        // set correct position
        var button = $('.toggle-filter-bubble');
        var bubble = $('.bubble');
        var toggle_button_position = (button.offset().left + (button.outerWidth() / 2)) - (bubble.outerWidth() / 2);

        var self = this;
        
        if ( self.tags && self.tags.length > 0 ) {
            var tag_html = "";
            $.each(self.tags,function(i,t){
                tag_html += "<a href='#' class='toggle-tag-filter'>"+t+"</a>";
            });
            bubble.html(tag_html);
        } else {
            bubble.html('No tags found');
        }
        bubble.css({'left':toggle_button_position + 'px'}).toggleClass('bubble-open');
        
        return false;
    },

    toggle_tag_filter : function ( evnt ) {
        evnt.preventDefault();

        var $target = $( evnt.currentTarget );
        var tag = $target.text();
        var $tagged_items = $('.items li.tag-'+tag);

        $('.items li').hide();
        $tagged_items.show();

        return false;
    },

    events_load_type : function ( evnt ) {
        
        var self = this;

        API.listEventsOfType( self.group_id, 'video', function(res) {
            self.update_event_list( res );
        });

        return false;
    },
    
    events_filter: function() {
        
        var self = this;
        var filter_max = parseFloat($('input[name="filter-max"]').val());
        var filter_min = parseFloat($('input[name="filter-min"]').val());

        // get all events...
        self.events_show_all();

        $(document).one('ajaxStop', function() {

            var $items = $('.items');

            // ... then remove all unnecessary evetns
            // TODO: extend API functions
            
            $items.find('li').slice(2).filter(function() {
    
                var t = parseFloat($(this).data('timestamp'));
                return t < filter_min || t > filter_max;
    
            }).remove();

            self.check_list_placeholder();
            self.get_selected_events_count();
            self.make_first_item_active();            
            self.toggle_filter_bubble();
                
        });
                
        return false;
    },

    event_update: function(e) {

        var obj = e.target;
        var parent = $(obj).closest('.item');
        var event_id = parent.data('id');
        var group_id = this.group_id;
        var self = this;
        var tpl = self.partials.update_event;
        
        // get event details and put them in edit form
        API.getEvent(group_id,event_id,function(res){
            parent.data('token',res.token);
            // TODO: cleanup!
            $('.form-crud',parent).remove();
            var fields = $.extend([],res.fields);
            $.each(res.fields,function(k,v){
                if ( k && v && typeof v !== 'function' )
                    fields.push({id:k,value:v});
            });
            fields.sort(function(a,b){
                if ( a && b ) return a.id.localeCompare(b.id);
                return 0;
            });
            var data = $.extend({},res);
            data = $.extend(data,{
                description: res.fields.description || res.fields.title || res.fields.movie_path,
                timestamp: res.utc_timestamp.getTime() / 1000.0,
                fields: fields
            });
            // console.log( data );
            parent.find('.link').hide().after(
                Mustache.render(tpl,data)
            );
        });

        return false;
    },

    event_set_in : function ( evnt ) {
        evnt.preventDefault();
        var self = this;
        var $link = $(evnt.currentTarget);
        var $form = $link.parent().parent();
        var $parent = $form.parent();
        var ts = self.get_timestamp_now();
        $('input[name=utc_timestamp]',$form).val( ts.getTime() / 1000.0 );
        return false;
    },

    event_set_out : function ( evnt ) {
        evnt.preventDefault();
        var self = this;
        var $link = $(evnt.currentTarget);
        var $form = $link.parent().parent();
        var $parent = $form.parent();
        var $utc_ts = $('input[name=utc_timestamp]',$form);
        var ts_event = parseFloat( $utc_ts.val() );
        var now = self.get_timestamp_now().getTime() / 1000.0;
        var dur_event = now - ts_event;
        if ( dur_event < 0 ) dur_event = 0;
        $('input[name=duration]',$form).val( dur_event );
        return false;
    },

    event_update_save: function(e) {

        var self = this;
        var obj = e.target;
        var parent = $(obj).closest('.item');
        var event_id = parent.data('id');
        
        //var event_ts = +(parent.data('timestamp'));
        var event_ts = ($('form input[name=utc_timestamp]',parent).val())*1000.0;
        var duration = parseFloat( $('form input[name=duration]',parent).val() );

        var event_token = parent.data('token');
        var group_id = this.group_id;
        var content = parent.find('textarea').val();

        var $fields_in = $('.fields input.field-id', parent);
        var fields = {
            description: content,
            updated_by_user_id: directory.user.id
        };
        $fields_in.each(function(i,e){
            var $e = $(e);
            var $v = $('.fields input[name="'+$e.attr('name').replace("[id]","[value]")+'"]', parent);
            if ( $e.length > 0 && $v.length > 0 ) {
                var key = $e.val();
                key = key.toLowerCase().replace(/[^-_.0-9a-z]/ig,"_");
                var val = $v.val();
                if ( key ) fields[ key ] = val;
            }
        });

        // store data
        var data = {
            duration : duration,
            utc_timestamp : new Date( event_ts ),
            token: event_token,
            fields: fields
        };

        if ( self.context_event && self.context_event.id ) {
            data.fields['context_event_update_id']   = self.context_event.id;
            data.fields['context_event_update_type'] = self.context_event.type;
        }

        // update event and on success update list
        API.updateEvent(group_id,event_id,data,function(res){
            parent.data('token',res.token);
            parent.find('form').remove();
            parent.replaceWith( self.render_event(res) );
            self.sort_events_list();
        });
        
        return false;
    },

    event_update_cancel: function(e) {
        var obj = e.target;
        var parent = $(obj).closest('.item');
        var content = parent.find('textarea').val();
        
        parent.find('form').remove();
        parent.find('.link').show();
        
        return false;
    },    

    event_delete: function(e) {

        if ( confirm( 'Delete this event?' ) ) {
            var self = this;
            var obj = e.target;
            var event_id = $(obj).closest('.item').data('id');
            var group_id = $('input[name="group-id"]').val();

            API.deleteEvent(group_id, event_id, function() {

                // remove item
                $(obj).closest('.item').remove();

                // update event counter
                var $counter = $('.counter-total');
                var n = parseInt($counter.text()) - 1;
                $counter.text(n);

                // show placeholder if there are no events
                if (n == 0) {
                    self.check_list_placeholder();
                }

                self.get_selected_events_count();

            });
        }

        return false;
    },

    event_go_to_timestamp: function ( e ) {

        var self = this;
        var obj = e.target;
        var movie_time = 0.0;

        var ts = $(obj).parent().data('timestamp');

        if ( self.time_reference && self.time_reference > 0.0 ) {
            movie_time = (ts - self.time_reference.getTime()) / 1000.0;
        }

        if ( self.player ) {
            self.player.currentTime(movie_time);
        }

        return false;
    },

    group_toggle_details: function() {

        $('.group-detail-content').toggleClass('toggle');

        return false;
    },

    // at the moment, the "movie"-type isn't used anymore, beacuse movies are attached to groups for now
    // we leave it, cause i might be useful for future changes

    change_event_type: function(e) {

        var obj = e.target;
        var val = $(obj).val();

        // hide all event-type-addition wrappers
        $('.event-type-addition').hide();

        // disable all unused input fields to bypass required attribute
        $('.event-type-addition:hidden').find('input').attr({'disabled':'disabled'});

        // show only type-specific container
        $('.event-type-addition[data-slug="'+val+'"]').show();

        // enable input field for selected type
        $('.event-type-addition:visible').find('input').removeAttr('disabled');
    }

});