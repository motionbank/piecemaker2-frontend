directory.HomeView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {
        this.$el.html(this.template());
        return this;
    }

});