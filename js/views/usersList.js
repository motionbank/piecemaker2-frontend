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

        var name = parent.find('input[name="name"]').val();
        var email = parent.find('input[name="email"]').val();
        var password = parent.find('textarea[name="password"]').val();
        var role_id = parent.find('input[name="role"]').val();
        var is_disabled = parent.find('input[name="disabled"]').val();

        // console.log(
        // 	name, email, password, role_id, is_disabled
        // );

        // if form is inside list item, use update function
        if (parent.attr('class') == 'item') {

            var id = parent.data('id');

            API.updateUser( id, name, email, role_id, is_disabled, password, function(usr){

            	console.log( usr );

                var content = Mustache.render(_partials.list,usr);
                parent.replaceWith(content);

            });

            console.log( "1" );

        // if form is standalone (add form), use create function
        } else if (parent.hasClass('users-crud-wrapper')) {

            API.createUser( name, email, role_id, function(usr){

            	console.log( usr );

                var content = Mustache.render(_partials.list,usr);
                parent.replaceWith(content);

            });

            console.log( "2" );
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

        if (parent.attr('class') == 'item') {
            parent.html(this.tmp);
        } else if (parent.hasClass('users-crud-wrapper')) {
            $('.users-crud-wrapper').addClass('toggle');
        }

    	return false;
    },

    user_update : function () {
    	return false;
    },

    user_delete : function () {
    	return false;
    },
});