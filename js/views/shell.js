directory.ShellView = Backbone.View.extend({

    id: 'main-wrapper',

    render: function () {
        this.$el.html(this.template());
        return this;
    },

    selectMenuItem: function(menuItem) {
        $('nav ul li').removeClass('active');
        if (menuItem) {
            $('.' + menuItem).addClass('active');
        }
    }

});