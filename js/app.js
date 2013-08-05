// save some global api settings
var apiURL = 'http://localhost:9292/api/v1/';
var apiKey;

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
        directory.shellView = new directory.ShellView();
        $('body').html(directory.shellView.render().el);
        this.$content = $("#content");
    },

    home: function () {

        // Since the home view never changes, we instantiate it and render it only once
        if (!directory.homelView) {
            directory.homelView = new directory.HomeView();
            directory.homelView.render();
        } else {
            directory.homelView.delegateEvents(); // delegate events when the view is recycled
        }

        // this.$content.transition({ opacity: 0, easing: 'snap', duration:100 }, function () { $(this).html(directory.homelView.el).css({'opacity':1}); }); // TODO: some nice fading?

        this.$content.html(directory.homelView.el);
        directory.shellView.selectMenuItem('home-menu');
    },

    groupsList: function () {

        directory.groupsListView = new directory.GroupsListView();
        directory.groupsListView.render();
        this.$content.html(directory.groupsListView.el);

        // add active class to navigation
        directory.shellView.selectMenuItem('pieces-menu');
    },

    groupsDetail: function (id) {
        directory.groupsDetailView = new directory.GroupsDetailView({model: id});
        directory.groupsDetailView.render();
        this.$content.html(directory.groupsDetailView.el);

        // add active class to navigation
        directory.shellView.selectMenuItem('pieces-menu');
    },

    login: function () {

        // Since the group list view never changes, we instantiate it and render it only once
        if (!directory.loginView) {
            directory.loginView = new directory.LoginView();
            directory.loginView.render();
        }

        this.$content.html(directory.loginView.el);

        // remove active classes
        directory.shellView.selectMenuItem('');
    },

    logout: function() {
        apiKey = '';
        directory.router.navigate("#", true);
    }

});

$(document).on("ready", function () {
    directory.loadTemplates(["LoginView", "HomeView", "GroupsListView", "GroupsDetailView", "ShellView"],
        function () {
            directory.router = new directory.Router();
            Backbone.history.start();
        });
});