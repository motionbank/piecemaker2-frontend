directory.LoginView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        // don't worry, only for development
        var email = directory.settings('user.email');
        var password = directory.settings('user.password');
        var checked = '';

        if (email && password) {
            checked = 'checked="checked"';
        }

        var last_api_url = directory.settings('api_url.last');

        var login_data = {
            api_url : piecemaker_settings.host,
            email : email,
            password : password,
            checked : checked,
            last_api_url : last_api_url
        };

        // render login template and set email and password if available
        $(obj).html(Mustache.to_html(template,login_data));
    },

    events: {
        "click #login":        "login",
        "click #login-delete": "login_delete"
    },

    login: function(){

        var api_url = $('input[name="api-url"]').val();

        if (api_url && api_url !== piecemaker_settings.host && /^http[s]?:\/\//.test(api_url) ) {
            piecemaker_settings.host = api_url;
            API = new PieceMakerApi( piecemaker_settings );
        }

        var email = $('input[name="email"]').val();
        var password = $('input[name="password"]').val();

        var $login_save = $('input[name="login-save"]');

        if ( $login_save.is(':checked') ) {
            directory.settings('user.email', email);
            directory.settings('user.password', password);
            directory.settings('api_url.last', $('input[name="api-url"]').val() );
        } else {
            this.clear_local_storage();
        }

        API.login(email,password,function(api_key){
            API.whoAmI(function(u){
                directory.user = u;
            });
            // API.listPermissions(function(perms){
            //     console.log( perms );
            // });
            directory.router.navigate('#/home', true);
        });

        return false;
    },

    clear_local_storage : function () {
        directory.settings('email',null);
        directory.settings('password',null);
    },

    login_delete: function() {
        
        this.clear_local_storage();

        $('input[name="email"]').val('');
        $('input[name="password"]').val('');
        $('input[name="login-save"]').attr('checked', false);

        return false;
    }

});