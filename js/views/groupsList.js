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

        var handleApiResponse = function(res) {
            var data = {
                groups:res,
                counter:res.length
            };

            $(obj).html(Mustache.render(template,data,_partials));
        };

        if ( userHasRole('super_admin') ) {
            API.listAllGroups(handleApiResponse);
        } else {
            API.listGroups(handleApiResponse);
        }

        // PiecemakerBridge.recorder("start")
        // PiecemakerBridge.recorder("stop")
        // console.log( PiecemakerBridge.recorder("fetch").split(";") );

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

        // if form is inside list item, use update function
        if (parent.attr('class') == 'item') {

            var id = parent.data('id');
            var data = {
                title:title,
                description:description
            };

            API.updateGroup(id,data,function(res){

                // update new content
                var content = Mustache.render(_partials.list,res);
                parent.replaceWith(content);

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