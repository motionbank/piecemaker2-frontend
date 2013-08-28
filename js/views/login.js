directory.LoginView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        /*
         * don't worry, only for development
         */

        var email = localStorage.getItem('email');
        var password = localStorage.getItem('password');

        var login_data = {
            email: email,
            password: password
        };

        $(obj).html(Mustache.to_html(template,login_data));
    },

    events: {
        "click #login": "login",
        "click #login-delete": "login_delete",
    },

    login: function(){

        var email = $('input[name="email"]').val();
        var password = $('input[name="password"]').val();
        var $login_save = $('input[name="login-save"]');

        if ($login_save.is(':checked')) {
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
        }

        API.login(email,password,function(res){
            directory.router.navigate('/home', true);
        });

        return false;
    },

    login_delete: function() {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        $('input[name="email"]').val('');
        $('input[name="password"]').val('');

        return false;
    }

});