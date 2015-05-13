directory.LoginView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {

        var template = this.template();
        var obj = this.el;

        // don't worry, only for development
        var email = directory.settings('login.email');
        var password = directory.settings('login.password');
        var checked = '';

        if (email && password) {
            checked = 'checked="checked"';
        }

        var last_api_url = directory.settings('login.host');

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
        }

        if ( !API ) {
            API = new PieceMakerApi( piecemaker_settings );
        }

        var email = $('input[name="email"]').val();
        var password = $('input[name="password"]').val();

        var $login_save = $('input[name="login-save"]');
        var api_host = $('input[name="api-url"]').val();

        if ( $login_save.is(':checked') ) {
            directory.settings('login.email', email);
            directory.settings('login.password', password);
            directory.settings('login.host', api_host );
        } else {
            this.clear_local_storage();
        }

        API.login(email,password,function(api_key){
            API.whoAmI(function(u){
                directory.settings("login.timeout",new Date().getTime());
                directory.settings("login.api_key",api_key);
                directory.settings('login.host', api_host);
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