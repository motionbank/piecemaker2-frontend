directory.GroupsListView = Backbone.View.extend({

    obj: null,
    template: null,
    partial_list_item: null,
    tmp: null, // var to store misc html temporary
    id: 'content-inner',

    render:function () {

        // store template and obj global
        this.template = this.template();
        this.obj = this.el;

        // clone for local use, cause we can't use "this" in API callback
        var tpl = this.template;
        var obj = this.obj;

        // get partial: list element
        $template = $(this.template);
        var $el = $('.groups-list ul li:nth-child(2)',$template);

        // define mustache partial
        partial_list_item = { "list" : $el[0].outerHTML };

        API.listGroups(function(res){
            $(obj).html(Mustache.render(tpl,res,partial_list_item));
        });

    },

    events: {
        "click .group-add": "group_add",
        "click .group-cancel": "group_cancel",
        "click .group-save": "group_save",
        "click .group-update": "group_update",
        "click .group-delete": "group_delete"
    },

    group_add: function() {
        $('.group-crud-wrapper').addClass('group-crud-wrapper-open');
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
            $('.group-crud-wrapper').removeClass('group-crud-wrapper-open');
        }

        return false;
    },

    group_save: function(e) {
        var obj = e.target;
        var parent = $(obj).closest('li');

        var title = parent.find('input[name="title"]').val();
        var text = parent.find('textarea[name="text"]').val();

        // if form is inside list item, use update function
        if (parent.attr('class') == 'item') {

            var id = parent.data('id');
            var data = {
                title:title,
                text:text
            };

            API.updateGroup(id,data,function(res){

                // update new content
                var content = Mustache.render(partial_list_item.list,res);
                parent.replaceWith(content);

            });

        // if form is standalone (add form), use create function
        } else if (parent.hasClass('group-crud-wrapper')) {
            API.createGroup(title,text,function(res){

                // append new content
                var content = Mustache.render(partial_list_item.list,res);
                $('.groups-list').find('ul').append(content);

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
            parent.find('textarea[name="text"]').val(res.text);

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
                parent.remove();
            });
        }
        return false;
    }

});