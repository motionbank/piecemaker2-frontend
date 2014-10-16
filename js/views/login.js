directory.LoginView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        // don't worry, only for development
        var email = localStorage.getItem('email');
        var password = localStorage.getItem('password');
        var checked = '';

        if (email && password) {
            checked = 'checked="checked"';
        }

        var login_data = {
            email: email,
            password: password,
            checked: checked
        };

        // render login template and set email and password if available
        $(obj).html(Mustache.to_html(template,login_data));
    },

    events: {
        "click #login": "login",
        "click #login-delete": "login_delete"
    },

    login: function(){

        var email = $('input[name="email"]').val();
        var password = $('input[name="password"]').val();
        var $login_save = $('input[name="login-save"]');

        if ($login_save.is(':checked')) {
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
        } else {
            clear_local_storage();
        }

        API.login(email,password,function(api_key){
            API.whoAmI(function(u){
                user = u;
            });
            // API.listPermissions(function(perms){
            //     console.log( perms );
            // });
            directory.router.navigate('#/home', true);
        });

        return false;
    },

    clear_local_storage : function () {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
    },

    login_delete: function() {
        
        clear_local_storage();

        $('input[name="email"]').val('');
        $('input[name="password"]').val('');
        $('input[name="login-save"]').attr('checked', false);

        return false;
    }

});