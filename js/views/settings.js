directory.SettingsView = Backbone.View.extend({

    id: 'content-inner',

    render : function () {
    	var template = this.template();
        var obj = this.el;
        var devices = [];
        if ( 'PiecemakerBridge' in window && PiecemakerBridge ) {
            devices = JSON.parse( PiecemakerBridge.recorder("devices") );
        }
        var opts = {
            recorder_device_name : directory.settings("recorder.device.name") || directory.settings("recorder.device.id"),
            recorder_devices : devices,
            system_information : [
                {name: 'Link', value: 'http://'+directory.config.host+'/index.html'}
            ],
            config : config
        };
        template = Mustache.render(template,opts);
        $(obj).html(template);
        $('.tab-container',obj).easytabs({animate:false});
    },

    events : {
    	"submit #recorder-device-settings" : "recorder_device_settings_changed",
        "submit #media-hosting-settings" :  "media_hosting_settings_changed"
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
    },

    media_hosting_settings_changed : function (e) {
        console.log( e.target );
        var host = $('#host',e.target).val();
        var base_url = $('#base-url',e.target).val();
        if ( !('config' in window) ) {
            window.config = {
                media : {
                    host : host,
                    base_url : base_url
                }
            };
        } else {
            if ( !( 'media' in config ) ) {
                config.media = {
                    host : host,
                    base_url : base_url
                }
            } else {
                config.media.host = host;
                config.media.base_url = base_url;
            }
        }
        //console.log(config.media);
        directory.settings( "settings.media.host",     config.media.host );
        directory.settings( "settings.media.base_url", config.media.base_url );
        return false;
    }

});