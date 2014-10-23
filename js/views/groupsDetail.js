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
    video: null,
    tmp: null,
    id: 'content-inner',

    time_reference : null,      // a Date reference, for example utc_timestamp of a movie 

    render:function () {
        
        // store template and obj globally
        var el = this.el;
        var self = this;
        var template = this.template();

        // save object vars
        var data = {};

        // get partial: list element
        var $template = $(template);

        // define mustache partial
        this.partials = {
            "list" :         $('.events-list-content ul li:nth-child(1)',$template)[0].outerHTML,
            'select_media' : $('#select-local-media',$template)[0].outerHTML 
        };

        // store the id of the group
        this.group_id = this.model;
        var group_id = this.group_id;

        // get group details and render html
        API.getGroup(this.group_id,function(group) {
            $.extend(data,{group:group});
        });

        // get events counter
        // don't count events with type "group_movie"
        API.listEvents(this.group_id,function(res) {
            var count = 0;
            $.each(res,function(){
                if (this.type != 'group_movie') count++;
            });
            $.extend(data,{event_counter:count});
        });

        // get event types and put them in a selectbox
        $.getJSON('js/options/event_types.json', function(event_types) {

            var event_types_array = new Array();

            $.each(event_types, function(key, val) {

                // at the moment, the "movie"-type isn't used anymore, beacuse movies are attached to groups for now
                // that's why we leave it out, but we don't remove the code, because it might be useful for the future

                if (val.slug != 'movie') {
                    event_types_array.push(val);
                }

            });

            $.extend(data,{event_types:event_types_array});
        });

        // render template when all ajax requests are finished
        // render it only once at initialization; prevent rendering everytime an ajax call stops
        $(document).one('ajaxStop', function() {

            // render template
            $(el).html(Mustache.render(template,data));

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

            // get assigned movie
            API.listEventsOfType( group_id, 'group_movie', function(res) {

                // any group videos available?
                if ( res.length > 0 ) {

                    var current_movie = res[0];

                    self.time_reference = new Date(current_movie.utc_timestamp.getTime());

                    $('.group-video-add').hide();

                    var movie_path = current_movie.fields.movie_path;
                    $('.group-video-content').find('video').attr({
                        src: 'http://localhost/piecemaker2-app/mov/'+movie_path
                    });

                    // cache video object
                    var $video = self.$('video');
                    var $items = $('.items');
                    
                    var video = $video.get(0);
                    self.video = video;

                    var end_time;

                    video.addEventListener('loadedmetadata', function() {
                        end_time = video.duration;
                    });

                    // add active class to events while playing 
                    video.addEventListener('timeupdate',function() {
                        
                        self.active_event = $items.find('li.active');
                        var $active = self.active_event;
                        var current_time = video.currentTime; 

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
                         
                    },false);

                    // set video time on input change
                    self.$('#video-time').bind('input', function(){
                        self.video.currentTime = parseFloat($(this).val());
                    });

                } else {

                    $('.group-video-content').hide();
                    $('#event-create-form').hide();
                    $('.group-video-add .tab-container').easytabs({
                        animate: false
                    });

                }

            });

        });

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
        "submit #event-create-form":        "event_save",
        "click .events-show-all":           "events_show_all",
        "click .toggle-filter-bubble":      "toggle_filter_bubble",
        "click .events-filter":             "events_filter",
        "click .event-update":              "event_update",
        "click .event-update-save":         "event_update_save",
        "click .event-update-cancel":       "event_update_cancel",
        "click .event-delete":              "event_delete",
        "click .event-go-to-timestamp":     "event_go_to_timestamp",
        "click .group-toggle-details":      "group_toggle_details",
        "change select[name=event-type]":   "change_event_type",

        'click #event-start-recording':     'start_recording',
        'click #event-add-local-media':     'add_local_media',
        'click #event-add-remote-media':    'add_remote_media', 
    },

    start_recording : function () {

        var self = this;

        if ( typeof PiecemakerBridge !== 'undefined' ) {
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
                    directory.router.navigate('#/groups/'+self.group_id, true);
                });
            }
            return false;
        }
    },

    add_local_media : function () {

        var self = this;
        var _partials = self.partials;

        var $ms = $('<div class="media-source" />');
        $('#tab-add-local-media .media-source').remove();

        if ( typeof PiecemakerBridge !== 'undefined' ) {

            var local_media = PiecemakerBridge.recorder("fetch").split(";");

            if ( local_media.length > 0 ) {

                // TODO: filter out already linked videos

                var $select_container = $( Mustache.render(_partials.select_media,local_media) );
                var $select_list = $('select',$select_container);
                
                $select_list.chosen({width:'100%'});
                $select_container.show();
                
                $( 'button', $select_container ).bind('click',function(){
                    
                    var file_path = $select_list.val();
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
                        directory.router.navigate('#/groups/'+self.group_id, true);
                    });
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

    add_remote_media : function () {

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

    event_save: function() {

        var self = this;
        var _partials = this.partials;

        // store form object
        var $form = $('#event-create-form');

        // get additional fields
        var fields = {
            description: $form.find('textarea').val()
        };

        // get type of event
        var type = $form.find('select[name="event-type"]').val();

        // get timestamp of video
        var timestamp = $('input[name="video-time"]').val();

        $.extend(fields,{'movie_timestamp':timestamp});

        if ( type == 'movie' ) {
            var movie_fields = {
                'movie_description' : $form.find('input[name="movie_description"]').val(),
                'movie_path' : $form.find('input[name="movie_path"]').val()
            };

            $.extend( fields, movie_fields );
        }

        // store data
        var data = {
            utc_timestamp: self.get_timestamp_now(),
            type: type,
            fields: fields
        };

        API.createEvent( this.group_id, data, function(res){

            // update event counter
            var $counter = $('.counter-total');
            $counter.text(parseInt($counter.text()) + 1);

            // show new event after active item
            var content = Mustache.render(_partials.list,res);
            $('.events-list').find('ul').append(content);

            self.sort_events_list();
            self.check_list_placeholder();
            self.get_selected_events_count();

            // reset form
            $('#event-create-form')[0].reset();

        });

        return false;
    },

    get_movie_time : function () {
        
        var self = this, mt = 0.0;

        if ( self.video.duration ) {

            mt = $('input[name="video-time"]').val();
            mt = ((mt && +(mt)) || 0.0) * 1000.0;

        } else if ( self.video.currentSrc && this.time_reference ) {

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

    events_show_all: function() {

        var self = this;
        var _partials = this.partials;

        // get events
        API.listEvents( this.group_id, function(res) {

            var $events_list = $('.events-list');
            var $list = $events_list.find('ul');
            
            $events_list.find('.item').not(':first-child').remove();

            // list events
            $.each(res, function(index,value) {
                if ( value.type !== 'group_movie' ) {
                    // we need an "last-added" class to sort events by timestamp

                    value.utc_timestamp_float = value.utc_timestamp.getTime();

                    var content = Mustache.render(_partials.list,value);
                    $list.append(content);
                }
            });

            self.sort_events_list();
            self.check_list_placeholder();
            self.get_selected_events_count();
            self.make_first_item_active();

        });

        return false;
    },

    toggle_filter_bubble: function() {
        
        // set correct position
        var button = $('.toggle-filter-bubble');
        var bubble = $('.bubble');
        var toggle_button_position = (button.offset().left + (button.outerWidth() / 2)) - (bubble.outerWidth() / 2);
        
        bubble.css({'left':toggle_button_position + 'px'}).toggleClass('bubble-open');
        
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
        
        // get event details and put them in edit form
        API.getEvent(group_id,event_id,function(res){
            parent.data('token',res.token);
            // TODO: cleanup!
            parent.find('.link').replaceWith('<form method="post" action="#" class="form-crud"><textarea class="mousetrap">'+res.fields.description+'</textarea><button type="submit" class="event-update-save icon-ok">Save</button><button class="event-update-cancel icon-remove">Cancel</button></form>');
        });

        return false;
    },

    event_update_save: function(e) {
        var obj = e.target;
        var parent = $(obj).closest('.item');
        var event_id = parent.data('id');
        var event_ts = +(parent.data('timestamp'));
        var event_token = parent.data('token');
        var group_id = this.group_id;
        var content = parent.find('textarea').val();

        // store data
        var data = {
            utc_timestamp : new Date( event_ts ),
            token: event_token,
            fields: {
                description: content
            }
        };

        // get event details and put them in edit form
        API.updateEvent(group_id,event_id,data,function(res){
            parent.data('token',res.token);
            parent.find('form').replaceWith('<a class="link event-go-to-timestamp" href="#">'+res.fields.description+'</a>');
        });
        
        return false;
    },

    event_update_cancel: function(e) {
        var obj = e.target;
        var parent = $(obj).closest('.item');
        var content = parent.find('textarea').val();
        
        parent.find('form').replaceWith('<a class="link event-go-to-timestamp" href="#">'+content+'</a>');
        
        return false;
    },    

    event_delete: function(e) {

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

        return false;
    },

    event_go_to_timestamp: function(e) {

        var self = this;
        var obj = e.target;
        var movie_time = 0.0;

        var ts = $(obj).parent().data('timestamp');

        if ( self.time_reference && self.time_reference > 0.0 ) {
            movie_time = (ts - self.time_reference.getTime()) / 1000.0;
        }

        if ( self.video ) {
            self.video.currentTime = movie_time;
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