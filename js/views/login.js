directory.LoginView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {
        this.$el.html(this.template());
        return this;
    },

    events: {
        "click #login": "login"
    },

    login: function(){

        var email = $('input[name="email"]').val();
        var password = $('input[name="password"]').val();

        var url = apiURL;

        $.ajax({
            url: url + 'user/login.json',
            type: 'POST',
            dataType: 'json',
            data: {'email':email, 'password':password},
            success: function (res) {
                apiKey = res.api_access_key;
                directory.router.navigate("/home", true)
            },
            error: function () {
                alert('wrong e-mail or password');
            }
        });

        return false;
    }

});