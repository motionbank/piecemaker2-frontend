/*
 * user right management
 */

function userHasPermission() {

    // only simple detection (same as userLoggedIn()) until user permissions are implemented
    return API.api_key;
}

function userLoggedIn() {
    return API.api_key;
}

/*
 * global shortcut handling
 */

Mousetrap.bind(['mod+s'], function(e) {
    $(':focus').closest('.form-crud').find(':submit').click();
    return false;
});

Mousetrap.bind(['?'], function(e) {
    $('.help').trigger('click');
    return false;
});

/*
 * help overlay
 */

$(document).on('click','.help', function(){
    alert('This alert box will be styled soon\n\n- Press CMD/CTRL + S to save forms\n- Columns in group detail view are resizable\n- Open this Help-Box by pressing "?"');
});

/*
 * global error handling
 */

function errorHandling(err) {
    var status = err[0];
    var route = Backbone.history.fragment;
    if (status == 401 && route == '') {
        alert('Wrong login data');
    } else if (status == 401 && route != '') {
        alert('Unauthorized');
    }
}

var settings = {
    context: {
        piecemakerError: function () {
            errorHandling(arguments);
        }
    },
    host: 'http://localhost:9292'
};

var API = new PieceMakerApi(settings);

var directory = {

    views: {},
    models: {},
    loadTemplates: function(views, callback) {

        var deferreds = [];

        $.each(views, function(index, view) {
            if (directory[view]) {
                deferreds.push($.get('tpl/' + view + '.html', function(data) {
                    directory[view].prototype.template = _.template(data);
                }, 'html'));
            } else {
                alert(view + " not found");
            }
        });

        $.when.apply(null, deferreds).done(callback);

    }

};

directory.Router = Backbone.Router.extend({

    routes: {
        "":             "login",
        "logout":       "logout",
        "home":         "home",
        "groups":       "groupsList",
        "groups/:id":   "groupsDetail"
    },

    initialize: function () {

        // force to login view if no api key is set/user isn't logged in
        if (!userHasPermission()) {
            window.location = '#';
        }

        // render main view
        directory.shellView = new directory.ShellView();
        $('body').html(directory.shellView.render().el);
        this.$content = $("#content");
    },

    home: function () {

        if (userHasPermission()) {
            // Since the home view never changes, we instantiate it and render it only once
            if (!directory.homelView) {
                directory.homelView = new directory.HomeView();
                directory.homelView.render();
            } else {
                directory.homelView.delegateEvents(); // delegate events when the view is recycled
            }

            this.$content.html(directory.homelView.el);
            directory.shellView.selectMenuItem('home-menu');
        }
    },

    groupsList: function () {

        if (userHasPermission()) {
            directory.groupsListView = new directory.GroupsListView();
            directory.groupsListView.render();
            this.$content.html(directory.groupsListView.el);

            // add active class to navigation
            directory.shellView.selectMenuItem('pieces-menu');
        }
    },

    groupsDetail: function (id) {

        if (userHasPermission()) {
            directory.groupsDetailView = new directory.GroupsDetailView({model: id});
            directory.groupsDetailView.render();
            this.$content.html(directory.groupsDetailView.el);

            // add active class to navigation
            directory.shellView.selectMenuItem('pieces-menu');
        }
    },

    login: function () {

        directory.loginView = new directory.LoginView();
        directory.loginView.render();
        this.$content.html(directory.loginView.el);

        // remove active classes
        directory.shellView.selectMenuItem('');

    },

    logout: function() {
        if (userHasPermission()) {
            API.logout(function(){

                // reset API key
                API.api_key = null;

                // redirect to login form
                directory.router.navigate("", true);
            });
        }
    }

});

// show/hide some elements if they are logged in
// TODO: improve when implementing user groups: http://stackoverflow.com/questions/17974259/how-to-protect-routes-for-different-user-groups
Backbone.history.bind("all", function (route, router) {

    var $logout_button = $('.logout');

    if (userLoggedIn()) {
        $logout_button.show();
    } else {
        $logout_button.hide();

        // force to login view if no api key is set
        directory.router.navigate("", true);
    }
});

$(function(){
    directory.loadTemplates(["LoginView", "HomeView", "GroupsListView", "GroupsDetailView", "ShellView"],
        function () {
            directory.router = new directory.Router();
            Backbone.history.start();
        });

});