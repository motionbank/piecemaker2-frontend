/*
 * Overview
 *
 * group_id:                    int
 * partials:                    obj
 * id:                          id of the wrapper (<div>)
 * render:                      initial render function
 * check_list_placeholder:      helper function
 * get_selected_events_count:   helper function
 * make_first_item_active       helper function
 * events:                      bind UI interactions
 * event_save:                  function for UI interaction
 * events_show_all:             function for UI interaction
 * events_filter:               function for UI interaction
 * event_delete:                function for UI interaction
 * event_go_to_timestamp:       function for UI interaction
 * group_toggle_details:        function for UI interaction
 * change_event_type:           function for UI interaction
 *
 */

directory.GroupsDetailView = Backbone.View.extend({

    group_id: null,
    partials: null,
    id: 'content-inner',

    render:function () {

        // store template and obj globally
        var el = this.el;
        var self = this;
        var template = this.template();

        // save object vars
        var data = {};

        // get partial: list element
        var $template = $(template);
        var $el = $('.events-list-content ul li:nth-child(1)',$template);

        // define mustache partial
        this.partials = { "list" : $el[0].outerHTML };

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
                handles: "e" // disable vertical resize
            });

            // enable nice styled select boxes
            $('select').chosen({
                disable_search_threshold: 10, // enable search only if there are more than 10 entries
                width: "100%"
            });

            // get assigned movie
            API.listEventsOfType(group_id,'group_movie',function(res) {

                var movie_path = res[0].fields.movie_path;
                $('.group-video-content').find('video').attr({'src':movie_path});

                // cache video object
                var $video = self.$('video');
                var video = $video.get(0);
                var end_time = video.endTime;                

                video.addEventListener('timeupdate',function() {
                    
                    var $active = $('.items').find('li.active');
                    var current_time = video.currentTime; 

                    // update timestamp on input field while playing video                    
                    self.$('#video-time').val(current_time);
                    
                    // make list item active, depending on the timestamp
                    var range_min = $active.data('timestamp');
                    var range_max = $active.next().data('timestamp');
                    if (!range_max) {
                        range_max = end_time;
                    }
                    
                    if (current_time > range_max) {
                        $active.removeClass('active');
                        $active.next().addClass('active');
                    } else if (current_time < range_min) {
                        $active.removeClass('active');
                        $active.prev().addClass('active');                        
                    }
                    
                     
                },false);

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

    events: {
        "submit":                           "event_save",
        "click .events-show-all":           "events_show_all",
        "click .events-filter":             "events_filter",
        "click .event-delete":              "event_delete",
        "click .event-go-to-timestamp":     "event_go_to_timestamp",
        "click .group-toggle-details":      "group_toggle_details",
        "change select[name=event-type]":   "change_event_type"
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

        // if type is movie, extend fields object
        //
        // at the moment, the "movie"-type isn't used anymore, beacuse movies are attached to groups for now
        // we leave it, cause i might be useful for future changes

        if (type == 'movie') {
            var movie_fields = {
                'movie_description' : $form.find('input[name="movie_description"]').val(),
                'movie_path' : $form.find('input[name="movie_path"]').val()
            };

            $.extend(fields,movie_fields);
        }

        // store data
        var data = {
            utc_timestamp: Date.now(),
            type: type,
            fields: fields
        };

        API.createEvent(this.group_id,data,function(res){

            // update event counter
            var $counter = $('.counter-total');
            $counter.text(parseInt($counter.text()) + 1);

            // show new event
            var content = Mustache.render(_partials.list,res);
            $('.events-list').find('ul').append(content);

            self.check_list_placeholder();
            self.get_selected_events_count();

            // reset form
            $('#event-create-form')[0].reset();

        });

        return false;
    },

    events_show_all: function() {

        var self = this;
        var _partials = this.partials;

        // get events
        API.listEvents(this.group_id,function(res) {

            // clear item list
            $('.events-list').find('.item').not(':first-child').remove();

            // list events
            $.each(res, function(index,value) {
                if (value.type != 'group_movie') {
                    var content = Mustache.render(_partials.list,value);
                    $('.events-list').find('ul').append(content);
                }
            });

            self.check_list_placeholder();
            self.get_selected_events_count();
            self.make_first_item_active();2

        });

        return false;
    },

    events_filter: function() {
        alert('coming soon');
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
        var timestamp = $(obj).data('timestamp');

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