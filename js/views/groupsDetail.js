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

//             var $video = self.$('video');
//             var video = $video.get(0);
//
//             // update timestamp on input field while playing video
//             video.addEventListener('timeupdate',function(){
//             self.$('#video-time').val(video.currentTime);
//             },false);

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
        if ($('.items').find('li').length > 2) {
            $('.list-placeholder').hide();
        }
    },

    events: {
        "submit":                       "event_save",
        "click .events-show-all":       "events_show_all",
        "click .events-filter":         "events_filter",
        "click .events-delete":         "events_delete",
        "click .event-toggle-details":  "event_toggle_details",
        "click .group-toggle-details":  "group_toggle_details"
    },

    event_save: function() {

        var self = this;

        // get partials in tmp var, cause we can't use "this" in ajax callbacks
        var _partials = this.partials;

        var fields = {
            description: $('#event-create-form').find('textarea').val()
        };

        var data = {
            utc_timestamp: Math.floor(Date.now() / 1000),
            type: $('#event-create-form').find('select[name="event-type"]').val(),
            fields: fields
        };

        API.createEvent(this.group_id,data,function(res){

            // update event counter
            var $counter = $('.counter');
            $counter.text(parseInt($counter.text()) + 1);

            // show new event
            var content = Mustache.render(_partials.list,res);
            $('.events-list').find('ul').append(content);

            self.check_list_placeholder();

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

    event_toggle_details: function() {
        alert('coming soon');
        return false;
    },

    group_toggle_details: function() {
        $('.group-detail-content').toggleClass('toggle');
        return false;
    }


});