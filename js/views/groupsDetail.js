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

        // get group details and render html
        API.getGroup(this.group_id,function(group) {
            $.extend(data,{group:group});
        });

        // get events
        API.findEvents(this.group_id,{'count_only':true},function(res) {
            $.extend(data,{event_counter:res.count});
        });

        // get event types and put them in a selectbox
        $.getJSON('js/options/event_types.json', function(event_types) {

            var event_types_array = new Array();

            $.each(event_types, function(key, val) {
                event_types_array.push(val);
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

    events: {
        "submit":                           "event_save",
        "click .events-show-all":           "events_show_all",
        "click .events-filter":             "events_filter",
        "click .events-delete":             "events_delete",
        "click .event-delete":              "event_delete",
        "click .event-toggle-details":      "event_toggle_details",
        "click .group-toggle-details":      "group_toggle_details",
        "change select[name=event-type]":   "change_event_type"
    },

    event_save: function() {

        var self = this;

        // get partials in tmp var, cause we can't use "this" in ajax callbacks
        var _partials = this.partials;

        // store form object
        var $form = $('#event-create-form');

        // get additional fields
        var fields = {
            description: $form.find('textarea').val()
        };

        // get type if event
        var type = $form.find('select[name="event-type"]').val();

        // if type is movie, extend fields object
        if (type == 'movie') {
            var movie_fields = {
                'movie_description' : $form.find('input[name="movie_description"]').val(),
                'movie_path' : $form.find('input[name="movie_path"]').val()
            };

            $.extend(fields,movie_fields);
        }

        // store data
        var data = {
            utc_timestamp: Math.floor(Date.now() / 1000),
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

        // get partials in tmp var, cause we can't use "this" in ajax callbacks
        var _partials = this.partials;

        // get events
        API.listEvents(this.group_id,function(res) {

            // clear item list
            $('.events-list').find('.item').not(':first-child').remove();

            // list events
            $.each(res, function(index,value) {
                var content = Mustache.render(_partials.list,value);
                $('.events-list').find('ul').append(content);
            });

            self.check_list_placeholder();
            self.get_selected_events_count();

        });

        return false;
    },

    events_filter: function() {
        alert('coming soon');
        return false;
    },

    events_delete: function() {
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

    event_toggle_details: function(e) {

        var self = this;
        var obj = e.target;
        var type = $(obj).parent().data('type');
        var event_id = $(obj).parent().data('id');
        var group_id = $('input[name="group-id"]').val();

        if (type == 'movie') {
            API.getEvent(group_id, event_id, function(res) {

                var movie_description = res.fields.movie_description;
                var movie_path = res.fields.movie_path;

                // cache video wrapper object
                var $video_wrapper = $('.event-video-content');

                // set movie description
                $video_wrapper.find('h2').text(movie_description);
                $video_wrapper.find('video').attr({'src':movie_path});

                // cache video object
                var $video = self.$('video');
                var video = $video.get(0);

                // update timestamp on input field while playing video
                video.addEventListener('timeupdate',function(){
                    self.$('#video-time').val(video.currentTime);
                },false);

                // show video wrapper
                $video_wrapper.toggleClass('toggle');

            });
        }

        return false;
    },

    group_toggle_details: function() {
        $('.group-detail-content').toggleClass('toggle');
        return false;
    },

    change_event_type: function(e) {
        var obj = e.target;
        var val = $(obj).val();
        $('.event-type-addition').hide();
        $('.event-type-addition[data-slug="'+val+'"]').show();
    }

});