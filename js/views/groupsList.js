directory.GroupsListView = Backbone.View.extend({

    obj: null,
    template: null,
    partial_list_item: null,
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

        console.log($el[0].outerHTML);

        API.listGroups(function(res){
            $(obj).html(Mustache.render(tpl,res,partial_list_item));
        });

    },

    events: {
        "click #group-add": "group_add",
        "click #group-add-cancel": "group_add_cancel",
        "click #group-save": "group_save",
        "click #group-update": "group_update",
        "click #group-delete": "group_delete"
    },

    group_add: function() {
        $('.group-add-wrapper').addClass('group-add-wrapper-open');
        return false;
    },

    group_add_cancel: function() {
        $('.group-add-wrapper').removeClass('group-add-wrapper-open');
        return false;
    },

    group_save: function() {
        var title = $('input[name="title"]').val();
        var text = $('textarea[name="text"]').val();

        API.createGroup(title,text,function(res){

            // append new content
            var content = Mustache.render(partial_list_item.list,res);
            $('.groups-list').find('ul').append(content);

            // reset form
            $('form')[0].reset();
            $('#group-add-cancel').click();

        });

        return false;

    },

    group_update: function() {
        return false;
    },

    group_delete: function() {
        return false;
    }

});