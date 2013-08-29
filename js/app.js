var settings = {
    base_url: 'http://localhost:9292'
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

        // force to login view if no api key is set
        if (!API.api_key) {
            window.location = '#';
        }

        // render main view
        directory.shellView = new directory.ShellView();
        $('body').html(directory.shellView.render().el);
        this.$content = $("#content");
    },

    home: function () {

        if (API.api_key) {
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

        if (API.api_key) {
            directory.groupsListView = new directory.GroupsListView();
            directory.groupsListView.render();
            this.$content.html(directory.groupsListView.el);

            // add active class to navigation
            directory.shellView.selectMenuItem('pieces-menu');
        }
    },

    groupsDetail: function (id) {

        if (API.api_key) {
            directory.groupsDetailView = new directory.GroupsDetailView({model: id});
            directory.groupsDetailView.render();
            this.$content.html(directory.groupsDetailView.el);

            // add active class to navigation
            directory.shellView.selectMenuItem('pieces-menu');
        }
    },

    login: function () {

        alert(API.api_key)

        directory.loginView = new directory.LoginView();
        directory.loginView.render();
        this.$content.html(directory.loginView.el);

        // remove active classes
        directory.shellView.selectMenuItem('');

    },

    logout: function() {
        if (API.api_key) {
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

    if (API.api_key) {
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