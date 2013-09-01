directory.GroupsDetailView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        // save object vars
        var template = this.template();
        var el = this.el;
        var self = this;
        var data;

        // get the id of the piece
        var id = this.model;

        // get group details and render html
        API.getGroup(id,function(group) {

            data = {
                group: group
            };

            /*
            // cache elements
            var $video = self.$('video');
            var video = $video.get(0);

            // update timestamp on input field while playing video
            video.addEventListener('timeupdate',function(){
                self.$('#video-time').val(video.currentTime);
            },false);
            */

            // enable window resizing
            self.$('.wrapper-left').resizable({
                minWidth: 150,
                autoHide: true,
                handles: "e" // disable vertical resize
            });

        });

        // get events
        API.listEvents(id,function(events) {
            $.extend(data,{event_counter:events.length});
        });

        // render template when all ajax requests are finished
        $(document).ajaxStop(function() {

            // render template
            $(el).html(Mustache.render(template,data));

            // set focus to form field
            $('textarea').focus();

        });

    },

    events: {
        "click .group-users-get": "group_users_get"
    },

    group_users_get: function() {
        return false;
    }

});