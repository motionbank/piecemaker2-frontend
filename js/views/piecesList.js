directory.PiecesListView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        /*
         * TODO: move API calls to model
         */

        $.ajax({
            url: 'http://localhost:9292/api/v1/groups.json',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                $(obj).html(Mustache.to_html(template,res));
            },
            error: function (err) {
                // error
            },
            headers: {
                'X-Access-Key': '0310XmMC6jDOq2ld'
            }
        });

    }

});