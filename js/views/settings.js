directory.SettingsView = Backbone.View.extend({

    id: 'content-inner',

    render:function () {
    	var template = this.template();
        var obj = this.el;
        $(obj).html(template);
        $('.tab-container',obj).easytabs({animate:false});
    }

});