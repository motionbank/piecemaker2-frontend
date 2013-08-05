directory.GroupsListView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        /*
         * TODO: move API calls to model
         */

        $.ajax({
            url: apiURL + 'groups.json',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                $(obj).html(Mustache.to_html(template,res));
            },
            error: function (err) {
                alert('no access');
            },
            headers: {
                'X-Access-Key': apiKey
            }
        });

    }

});