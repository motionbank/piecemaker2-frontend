/*
 * Overview
 *
 * partials:                    cached partials html
 * tmp:                         temporary var to store html snippets
 * id:                          id of the wrapper (<div>)
 * render:                      initial render function
 * events:                      bind UI interactions
 * submit:                      function for UI interaction
 * group-add                    function for UI interaction
 * group-cancel                 function for UI interaction
 * group-update                 function for UI interaction
 * group-delete                 function for UI interaction
 *
 */

directory.GroupsListView = Backbone.View.extend({

    partials: null,
    tmp: null,
    id: 'content-inner',

    render:function () {

        // store template and obj globally
        var template = this.template();
        var obj = this.el;

        // get partial: list element
        var $template = $(template);
        var $el = $('.groups-list ul li:nth-child(1)',$template);

        // define mustache partial
        this.partials = { "list" : $el[0].outerHTML };
        var _partials = this.partials;

        API.listGroups(function(res) {
            var data = {
                groups:res,
                counter:res.length
            };

            $(obj).html(Mustache.render(template,data,_partials));
        });

    },

    events: {
        "submit":               "group_save",
        "click .group-add":     "group_add",
        "click .group-cancel":  "group_cancel",
        "click .group-update":  "group_update",
        "click .group-delete":  "group_delete"
    },

    group_add: function() {
        $('.group-crud-wrapper').removeClass('toggle');
        return false;
    },

    group_cancel: function(e) {

        var obj = e.target;
        var parent = $(obj).closest('li');

        // check if form is inside a list item or standalone (add form)
        if (parent.attr('class') == 'item') {

            // show old content
            parent.html(this.tmp);

        } else if (parent.hasClass('group-crud-wrapper')) {

            // close add form
            $('.group-crud-wrapper').addClass('toggle');
        }

        return false;
    },

    group_save: function(e) {

        var obj = e.target;
        var parent = $(obj).closest('li');
        var _partials = this.partials;

        var title = parent.find('input[name="title"]').val();
        var description = parent.find('textarea[name="description"]').val();
        var movie_path = parent.find('input[name="movie-path"]').val();

        // if form is inside list item, use update function
        if (parent.attr('class') == 'item') {

            var id = parent.data('id');
            var data = {
                title:title,
                description:description,
                text:description
            };

            API.updateGroup(id,data,function(res){

                // update new content
                var content = Mustache.render(_partials.list,res);
                parent.replaceWith(content);

            });

            API.listEventsOfType(id,'group_movie',function(movs){
                if ( movs && movs.length > 0 ) {
                    var movie = movs[0];
                    movie.fields['movie_path'] = movie_path;
                    API.updateEvent(id,movie.id,movie,function(m){
                        // should be ok now ...
                    });
                }
            });

        // if form is standalone (add form), use create function
        } else if (parent.hasClass('group-crud-wrapper')) {

            // we have to seperate the group creation and the movie-assignation to a group, because the API don't allow
            // to save additional fields to groups
            // that's why we create an extra event with a special type to assign a movie to a group
            API.createGroup(title,description,function(res){

                // append new content
                var content = Mustache.render(_partials.list,res);
                $('.groups-list').find('ul').append(content);

                // update group counter
                var $counter = $('.counter');
                $counter.text(parseInt($counter.text()) + 1);

                // reset form
                var $wrapper = $('.group-crud-wrapper');
                $wrapper.find('form')[0].reset();
                $wrapper.find('.group-cancel').click();

                // we have to save the new event that assigns a movie to a group in the createGroup Callback, because
                // we need the ID of the new group

                var group_id = res.id;
                var event_data = {
                    utc_timestamp: Date.now(),
                    type: 'group_movie',
                    fields: {'movie_path':movie_path}
                };

                API.createEvent(group_id,event_data);

            });
        }

        return false;

    },

    group_update: function(e) {
        var obj = e.target;
        var parent = $(obj).closest('.item');
        var id = parent.data('id');

        // store old content temporary
        this.tmp = parent.html();

        // get form html and append it
        var form = $('.group-crud-wrapper').html();
        parent.html(form);

        // get group details and put them in edit form
        API.getGroup(id,function(res){

            parent.find('input[name="title"]').val(res.title);
            parent.find('textarea[name="description"]').val(res.description);

        });

        // get assigned group movie
        API.listEventsOfType(id,'group_movie',function(res) {

            var movie_path = res[0].fields.movie_path;
            parent.find('input[name="movie-path"]').val(movie_path);

        });

        return false;
    },

    group_delete: function(e) {
        var obj = e.target;
        var parent = $(obj).closest('.item');
        var id = parent.data('id');

        var check = confirm('Delete?');
        if (check) {
            API.deleteGroup(id,function(){

                // update group counter
                var $counter = $('.counter');
                $counter.text(parseInt($counter.text()) - 1);

                // remove list item
                parent.remove();
            });
        }
        return false;
    }

});