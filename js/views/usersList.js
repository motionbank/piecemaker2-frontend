directory.UsersListView = Backbone.View.extend({

    partials: null,
    tmp: null,
    id: 'content-inner',

    events: {
        "submit":               "user_save",
        "click .users-add":     "user_add",
        "click .users-cancel":  "user_cancel",
        "click .users-update":  "user_update",
        "click .users-delete":  "user_delete"
    },

    render:function () {

        // store template and obj globally
        var template = this.template();
        var obj = this.el;

        // get partial: list element
        var $template = $(template);
        var $el = $('.users-list ul li:nth-child(1)',$template);

        // define mustache partial
        this.partials = { "list" : $el[0].outerHTML };
        var _partials = this.partials;

        if ( userHasRole('super_admin') ) {
            API.listUsers(function(usrs){

            	usrs = $.each(usrs,function(i,u){
            		u.password = null;
            		if ( u.id === directory.user.id ) {
            			u.is_current = true;
            		}
            		return u;
            	});
            	self.users = usrs;

            	$(obj).html(Mustache.render(template,{users:usrs},_partials));
            });
        }
    },

    user_save : function (e) {

    	e.preventDefault();

		var obj = e.target;
        var parent = $(obj).closest('li');
        var _partials = this.partials;

        var name = 			parent.find('input[name="name"]').val();
        var email = 		parent.find('input[name="email"]').val();
        var new_password =  parent.find('input[name="new-password"]').is(':checked');
        var role_id = 		parent.find('input[name="role"]').val();
        var is_disabled = 	false; //parent.find('input[name="is-disabled"]').is(':checked');

        // console.log(
        // 	name, email, new_password, role_id, is_disabled
        // );

        // if form is inside list item, use update function
        if (parent.hasClass('item')) {

            var id = parent.data('id');
            var fnCallback = function(usr){

            	console.log( usr );

                var content = Mustache.render(_partials.list,usr);
                parent.replaceWith(content);

            };

            if ( role_id || new_password === true ) {
	            API.updateUser( id, name, email, role_id, is_disabled, new_password, fnCallback);
	        } else {
	            API.updateUser( id, name, email, fnCallback);
	        }

        // if form is standalone (add form), use create function
        } else if (parent.hasClass('users-crud-wrapper')) {

            API.createUser( name, email, role_id, function(usr){

            	console.log( usr );

                var content = Mustache.render(_partials.list,usr);
                parent.replaceWith(content);

            });
        }

    	return false;
    },

    user_add : function () {
    	$('.users-crud-wrapper').removeClass('toggle');
        return false;
    },

    user_cancel : function (e) {

    	var obj = e.target;
        var parent = $(obj).closest('li');

        if (parent.hasClass('item')) {
            parent.html(this.tmp);
        } else if (parent.hasClass('users-crud-wrapper')) {
            $('.users-crud-wrapper').addClass('toggle');
        }

    	return false;
    },

    user_update : function (e) {


    	console.log( "updated" );

    	var obj = e.target;
        var parent = $(obj).closest('.item');
        var id = parent.data('id');

        this.tmp = parent.html();
        var form = $('.users-crud-wrapper').html();
        form = form.replace(/(id|for)="new-password"/g, '$1="new-password-'+id+'"');
        parent.html(form);

        // get group details and put them in edit form
        API.getUser( id, function(usr){

            parent.find('input[name="name"]').val(usr.name);
            parent.find('input[name="email"]').val(usr.email);
            //parent.find('input[name="new-password"]').attr('checked',usr.is_);
            //parent.find('input[name="is-disabled"]').val(usr.is_disabled ? true : false);
            parent.find('input[name="role"]').val(usr.user_role_id);

        });

    	return false;
    },

    user_delete : function () {
    	return false;
    },
});