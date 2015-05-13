/*
 */

directory.GroupsUsersView = Backbone.View.extend({

    partials:   null,
    tmp:        null,
    id:         'content-inner',
    group_id:   null,
    roles:      {user:{id:'user',description:'Almost no rights at all'}},

    initialize : function ( opts ) {

        this.group_id = opts.group_id;
        var self = this;

        API.listRoles(function(roles){
            $.each(roles,function(i,r){
                self.roles[r.id] = r;
            });
        });
    },

    render:function ( id ) {

        var self = this;

        // store template and obj globally
        var template = this.template();
        var obj = this.el;

        // get partial: list element
        var $template = $(template);
        var $el = $('.groups-users ul li:nth-child(1)',$template);

        // define mustache partial
        this.partials = { "list" : $el[0].outerHTML };
        var _partials = this.partials;

        API.listGroupUsers( this.group_id, function(usrs) {
            usrs = $.each(usrs,function(i,u){
                u.password = null;
                if ( u.id === directory.user.id ) {
                    u.is_current = true;
                }
                return u;
            });
            self.users = usrs;
        });

        $(document).one('ajaxStop', function() {
            
            var roles_render = [];
            $.each(self.roles,function(i,r){
                roles_render.push(r);
            });
            roles_render.sort(function(a,b){
                return a.id.localeCompare(b.id);
            });

            $(obj).html(Mustache.render(template,{users:self.users, roles:roles_render},_partials));

            // enable nice styled select boxes
            $('select').chosen({
                disable_search_threshold: 10, // enable search only if there are more than 10 entries
                width: "100%"
            });
        });

    },

    events: {
        "submit":               "group_user_save",
        "click .users-add":     "group_user_add",
        "click .users-update":  "group_user_update",
        "click .users-remove":  "group_user_remove",
        "click .users-cancel":  "group_user_cancel"
    },

    group_user_save : function (e) {

        e.preventDefault();
        var self = this;

        var obj = e.target;
        var parent = $(obj).closest('li');
        var _partials = this.partials;

        var user_id = parent.find('input[name="user_id"]').val();
        var role_id = parent.find('select[name="role"]').val();

        // if form is inside list item, use update function
        if (parent.hasClass('item')) {

            API.changeUserRoleInGroup( self.group_id, user_id, role_id, function(usr){
                API.getUser(usr.user_id,function(usr2){
                    var content = Mustache.render(_partials.list,usr2);
                    parent.replaceWith(content);
                });
            } );

        // // if form is standalone (add form), use create function
        } else if ( parent.hasClass('users-crud-wrapper') ) {

            var already_in_group = false;
            $.each(self.users,function(i,u){
                if ( u.id == user_id ) {
                    already_in_group = true;
                    return false;
                }
            });

            var fn = function (usr) {
                API.getUser(usr.user_id,function(usr2){
                    var content = Mustache.render(_partials.list,usr2);
                    parent.replaceWith(content);
                });
            }

            if ( already_in_group ) {
                API.changeUserRoleInGroup( self.group_id, user_id, role_id, fn );
            } else {
                API.addUserToGroup( self.group_id, user_id, role_id, fn );
            }
        }

        return false;
    },

    group_user_cancel : function (e) {
        
        var obj = e.target;
        var parent = $(obj).closest('li');
        var self = this;

        if ( parent.hasClass('item') ) {
            parent.html( this.tmp );
        } else if (parent.hasClass('users-crud-wrapper')) {
            $('.users-crud-wrapper').addClass('toggle');
        }

        return false;
    },

    group_user_add : function (e) {

        $('.users-crud-wrapper').removeClass('toggle');
        return false;
    },

    group_user_update : function (e) {

        var obj = e.target;
        var parent = $(obj).closest('.item');
        var id = parent.data('id');

        $('.item form').remove();
        this.tmp = parent.html();
        var form = $('.users-crud-wrapper').html();
        $('form',parent).remove();
        parent.append('<div class="break"></div>'+form);
        $('.chosen-container',parent).remove();
        $('select',parent).chosen({
            disable_search_threshold: 10,
            width: '100%'
        });
        $('input[name="user_id"]',parent).attr('type','hidden');

        // get group details and put them in edit form
        API.getUser( id, function(usr){

            parent.find('input[name="user_id"]').val(usr.id);
            parent.find('select[name="role"]').val(usr.user_role_id).trigger('chosen:updated');

        });

        return false;
    },

    group_user_remove : function (e) {

        var obj = e.target;
        var parent = $(obj).closest('.item');
        var id = parent.data('id');
        var self = this;

        API.getUser( id, function(usr){
            API.removeUserFromGroup( self.group_id, usr.id, function(){
                parent.remove();
            });
        });

        return false;
    },

});