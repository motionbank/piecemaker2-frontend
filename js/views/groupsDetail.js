directory.GroupsDetailView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        // save object vars
        var template = this.template();
        var el = this.el;
        var self = this;

        // get the id of the piece
        var data = {'id':this.model};

        // render html
        $(el).html(Mustache.to_html(template,data));

        // cache elements
        var $video = self.$('video');
        var video = $video.get(0);

        // update timestamp on input field while playing video
        video.addEventListener('timeupdate',function(){
            self.$('#video-time').val(video.currentTime);
        },false);

        // enable window resizing
        self.$('.wrapper-left').resizable({
            minWidth: 150,
            autoHide: true,
            handles: "e" // disable vertical resize
        });

    }

});