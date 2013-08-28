directory.GroupsListView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        API.listGroups(function(res){
            $(obj).html(Mustache.to_html(template,res));
        });

    }

});