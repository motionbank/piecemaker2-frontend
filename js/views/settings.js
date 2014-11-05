directory.SettingsView = Backbone.View.extend({

    id: 'content-inner',

    render : function () {
    	var template = this.template();
        var obj = this.el;
        var opts = {
            recorder_device_name : directory.settings("recorder.device.name") || directory.settings("recorder.device.id"),
            recorder_devices : JSON.parse( PiecemakerBridge.recorder("devices") ),
            system_information : [
                {name: 'Link', value: 'http://'+directory.config.host+':50726/index.html'}
            ]
        };
        template = Mustache.render(template,opts);
        $(obj).html(template);
        $('.tab-container',obj).easytabs({animate:false});
    },

    events : {
    	"submit #recorder-device-settings" : "recorder_device_settings_changed"
    },

    recorder_device_settings_changed : function (e) {
        var $sel = $('select',e.target);
    	var device_id = $sel.val();
        var device_name = $('option[value='+device_id+']',$sel).text();
        //console.log(new_device);
        directory.settings("recorder.device.id",device_id);
        directory.settings("recorder.device.name",device_name);
        //console.log( device_id, device_name );
        return false;
    }

});