directory.GroupsDetailView = Backbone.View.extend({

    group_id: null,
    id: 'content-inner',

    render:function () {

        // save object vars
        var template = this.template();
        var el = this.el;
        var self = this;
        var data = {};

        // store the id of the group
        this.group_id = this.model;

        // clone id for local use
        var id = this.group_id;

        // get group details and render html
        API.getGroup(id,function(group) {

            $.extend(data,{group:group});

            /*
            // cache elements
            var $video = self.$('video');
            var video = $video.get(0);

            // update timestamp on input field while playing video
            video.addEventListener('timeupdate',function(){
                self.$('#video-time').val(video.currentTime);
            },false);
            */

        });

        // get events
        API.listEvents(id,function(events) {
            $.extend(data,{event_counter:events.length});
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

    events: {
        "submit":                   "event_save",
        "click .group-users-get":   "group_users_get"
    },

    group_users_get: function() {
        return false;
    },

    event_save: function() {

        var id = this.group_id;
        var data = {
            utc_timestamp: Math.floor(Date.now() / 1000),
            type: $('select[name="event-type"]').val()
        };

        API.createEvent(id,data,function(res){

            // update event counter
            var $counter = $('.counter');
            $counter.text(parseInt($counter.text()) + 1);

        });

        return false;
    }

});