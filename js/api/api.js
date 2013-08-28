// Piecemaker 2 API client for Processing and Java / JS
// ====================================================

//  Created by fjenett 2012, 2013
//  https://github.com/motionbank/piecemaker-api-client

//  See:
//	http://motionbank.org/
//	http://piecemaker.org/

//	Version: ##version##
//	Build: ##build##

var PieceMakerApi = (function(){

    // Helpers
    // -------

    // ... just an empty function to use in place of missing callbacks

    var noop = function(){};

    // Convert Processing.js HashMaps to JavaScript objects

    var convertData = function ( data ) {
        if ( !data ) return data;
        if ( typeof data !== 'object' ) return data;
        if ( 'entrySet' in data && typeof data.entrySet === 'function' ) {
            var allowed_long_keys = ['utc_timestamp'];
            var set = data.entrySet();
            if ( !set ) return data;
            var obj = {};
            var iter = set.iterator();
            while ( iter.hasNext() ) {
                var entry = iter.next();
                var val = entry.getValue();
                if ( val && typeof val === 'object' &&
                    'entrySet' in val &&
                    typeof val.entrySet === 'function' ) val = convertData(val);
                var key = entry.getKey();
                /* issue 48 */
                if ( !key || (allowed_long_keys.indexOf(key.toLowerCase()) === -1 && key.length > 10) ) {
                    throw( "Field key is not valid: " + key );
                }
                obj[entry.getKey()] = val;
            }
            return obj;
        }
        return data;
    }

    // temporary fix for:
    // https://github.com/motionbank/piecemaker2/issues/54

    var fixEventsResponseToArr = function ( resp ) {
        if ( resp instanceof Array ) {
            var arr = [];
            for ( var i = 0; i < resp.length; i++ ) {
                arr.push( expandEventToObject( fixEventResponse( resp[i] ) ) );
            }
            return arr;
        }
        return resp;
    }

    var fixEventResponse = function ( resp ) {
        var eventObj = resp['event'];
        eventObj['fields'] = {};
        for ( var i = 0, fields = resp['fields']; i < fields.length; i++ ) {
            eventObj['fields'][fields[i]['id']] = fields[i]['value'];
        }
        return eventObj;
    }

    var expandEventToObject = function ( event ) {
        event.fields.get = (function(e){
            return function ( k ) {
                return e.fields[k];
            }
        })(event);
        event.utc_timestamp = new Date( event.utc_timestamp * 1000.0 );
        return event;
    }

    var jsDateToTs = function ( date_time ) {
        if ( date_time instanceof Date ) {
            return date_time.getTime() / 1000.0;
        } else {
            return date_time; // assume it's ok
        }
    }

    // XHR requests
    // ------------

    /* cross origin resource sharing
     http://www.html5rocks.com/en/tutorials/cors/ */

    var xhrRequest = function ( context, url, type, data, success ) {

        // Almost all calls to the API need to be done including a per-user API token.
        // This token is passed into the constructor below and gets automatically
        // added to each call here if it is not already present.

        if ( !api.api_key && !url.match(/\/user\/login$/) ) {
            throw( "PieceMakerApi: need an API_KEY, please login first to obtain one" );
        }

        var ts = (new Date()).getTime();
        var callUrl = url + '.json';

        jQuery.ajax({
            url: callUrl,
            type: type,
            dataType: 'json',
            data: data,
            // before: function ( xhr ) {
            // 	if ( !url.match(/\/user\/login$/) ) {
            // 		xhr.setRequestHeader( 'X-Access-Key', api.api_key );
            // 	}
            // },
            context: context,
            success: function () {
                if ( arguments && arguments[0] &&
                    typeof arguments[0] === 'object' &&
                    !(arguments[0] instanceof Array) &&
                    !('queryTime' in arguments[0]) ) {
                    arguments[0]['queryTime'] = ((new Date()).getTime()) - ts;
                }
                success.apply( context, arguments );
            },
            error: function (err) {
                xhrError( context, callUrl, type, err );
            },
            /* , xhrFields: { withCredentials: true } */
            /* , headers: { 'Cookie' : document.cookie } */
            headers: {
                'X-Access-Key': api.api_key
            }
        });
    };

    var xhrGet = function ( pm, opts ) {
        xhrRequest( pm, opts.url, 'get', opts.data, opts.success );
    }

    var xhrPut = function ( pm, opts ) {
        xhrRequest( pm, opts.url, 'put', opts.data, opts.success );
    }

    var xhrPost = function ( pm, opts ) {
        xhrRequest( pm, opts.url, 'post', opts.data, opts.success );
    }

    var xhrDelete = function ( pm, opts ) {
        xhrRequest( pm, opts.url, 'delete', null, opts.success );
    }

    var xhrError = function ( context, url, type, err ) {

        var statusCode = -1, statusMessage = "";

        if ( err ) {
            statusCode = err.status;
            statusMessage = err.statusText;
            if ( err.responseText ) {
                statusMessage += " " + err.responseText;
            }
        }

        if ( api.context
            && 'piecemakerError' in api.context
            && typeof api.context['piecemakerError'] == 'function' )
            api.context['piecemakerError']( statusCode, statusMessage, type.toUpperCase() + " " + url );
        else
            throw( err );
    }

    // Library global variables
    // ------------------------

    var api; // FIXME: in this scope it will be replaced by the next constructor call!

    // Class PieceMakerApi2
    // ---------------------

    // The actual implementation of the client class starts here

    // ###PieceMakerApi()

    // Expects either 3 arguments or an object with:
    // ```
    // {
    //   context: <object>,
    //   base_url: <string>
    // }
    // ```

    var _PieceMakerApi = function () {

        // Fields

        this.base_url 	= undefined;
        this.api_key	= undefined;
        this.context 	= undefined;

        // Parsing the parameters

        var params = arguments[0];

        if ( arguments.length == 1 && typeof params == 'object' ) {
            this.context 	= params.context || {};
            //this.api_key	= params.api_key || false;
            this.base_url 	= params.base_url || 'http://localhost:9292';
        } else {
            if ( arguments.length >= 1 && typeof arguments[0] == 'object' ) {
                this.context = arguments[0];
            }
            if ( arguments.length >= 2 && typeof arguments[1] == 'string' ) {
                this.base_url = arguments[1];
            }
            // if ( arguments.length >= 3 && typeof arguments[2] == 'string' ) {
            // 	this.api_key = arguments[2];
            // }
        }

        this.base_url += '/api/v1';

        // Since piecemaker 2 we require the API key to be added

        //if ( !this.api_key ) throw( "PieceMaker2API: need an API_KEY for this to work" );

        api = this; // ... store for internal use only
    }

    /* just as a personal reference: discussing the routes
     https://github.com/motionbank/piecemaker2/issues/17 */

    // Users
    // ------

    // ###Log a user in

    // Returns api key as string

    _PieceMakerApi.prototype.login = function ( userEmail, userPassword, cb ) {
        var callback = cb || noop;
        if ( !userEmail || !userPassword ) {
            throw( "PieceMakerApi: need name and password to log user in" );
        }
        var self = this;
        xhrPost( this, {
            url: self.base_url + '/user/login',
            data: {
                email: userEmail,
                password: userPassword
            },
            success: function ( response ) {
                var api_key_new = null;
                if ( response && 'api_access_key' in response && response['api_access_key'] ) {
                    self.api_key = response['api_access_key'];
                    api_key_new = self.api_key;
                }
                callback.call( self.context || cb, api_key_new );
            }
        });
    }

    // ###Log a user out

    _PieceMakerApi.prototype.logout = function ( cb ) {
        var callback = cb || noop;
        if ( !userEmail || !userPassword ) {
            throw( "PieceMakerApi: need name and password to log user in" );
        }
        var self = this;
        xhrPost( this, {
            url: self.base_url + '/user/logout',
            success: function ( response ) {
                if ( response && 'api_access_key' in response && response['api_access_key'] ) {
                    self.api_key = response['api_access_key'];
                }
                callback.call( self.context || cb, null );
            }
        });
    }

    // ###Get all users

    // Returns a list of all users

    _PieceMakerApi.prototype.listUsers = function ( cb ) {
        var callback = cb || noop;
        var self = this;
        xhrGet( this, {
            url: self.base_url + '/users',
            success: function ( response ) {
                callback.call( self.context || cb, response );
            }
        });
    }

    // ###Get self

    // Returns the user object for the user to given API key

    _PieceMakerApi.prototype.whoAmI = function ( cb ) {
        var callback = cb || noop;
        var self = this;
        xhrGet( this, {
            url: self.base_url + '/user/me',
            success: function ( response ) {
                callback.call( self.context || cb, response );
            }
        });
    }

    // ###Create a user

    // Creates a new user and returns it

    _PieceMakerApi.prototype.createUser = function ( userName, userEmail, userPassword, userToken, cb ) {
        var callback = cb || noop;
        var self = this;
        xhrPost( self, {
            url: self.base_url + '/user',
            data: {
                name: userName, email: userEmail,
                password: userPassword, api_access_key: userToken
            },
            success: function ( response ) {
                callback.call( self.context || cb, response );
            }
        });
    }

    // ###Get one user

    // Get a user based on ID

    _PieceMakerApi.prototype.getUser = function ( userId, cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/user/' + userId,
            success: function ( response ) {
                callback.call( api.context || cb, response );
            }
        });
    }

    // ###Update one user

    // Update a user and return it

    _PieceMakerApi.prototype.updateUser = function ( userId, userName, userEmail, userPassword, userToken, cb ) {
        var callback = cb || noop;
        var self = this;
        xhrPut( self, {
            url: self.base_url + '/user/' + userId,
            data: {
                name: userName, email: userEmail,
                password: userPassword, api_access_key: userToken
            },
            success: function ( response ) {
                callback.call( self.context || cb, response );
            }
        });
    }

    // ###Delete one user

    // Delete a user

    _PieceMakerApi.prototype.deleteUser = function ( userId, cb ) {
        var callback = cb || noop;
        xhrDelete( this, {
            url: api.base_url + '/user/' + userId,
            success: function ( response ) {
                callback.call( api.context || cb /*, response*/ );
            }
        });
    }

    // Groups
    // -------

    // Groups are what Piecemaker 1 called "Piece":
    // they are just a collection of events

    // ###Get all groups

    // Get a list of all available (to current user) groups

    _PieceMakerApi.prototype.listGroups = function ( cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/groups',
            success: function ( response ) {
                callback.call( api.context || cb, response );
            }
        });
    }

    // ###Create a group

    // Arguments:
    // ```title``` is the name of the group
    // ```text``` is the group description
    // [ ```callback``` an optional callback ]

    // Returns:
    // A fully loaded group object

    _PieceMakerApi.prototype.createGroup = function ( groupTitle, groupText, cb ) {
        var callback = cb || noop;
        var self = this;
        if ( !groupTitle ) {
            throw( "createGroup(): title can not be empty" );
        }
        xhrPost( self, {
            url: self.base_url + '/group',
            data: {
                title: groupTitle,
                text: groupText || ''
            },
            success: function ( response ) {
                callback.call( self.context || cb, response );
            }
        });
    }

    // ###Get a group

    // Returns:
    // A fully loaded group object

    _PieceMakerApi.prototype.getGroup = function ( groupId, cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/group/'+groupId,
            success: function ( response ) {
                callback.call( api.context || cb, response );
            }
        });
    }

    // ###Update a group

    // Returns:
    // A fully group object

    _PieceMakerApi.prototype.updateGroup = function ( groupId, groupData, cb ) {
        var data = convertData( groupData );
        var callback = cb || noop;
        var self = this;
        xhrPut( self, {
            url: self.base_url + '/group/'+groupId,
            data: data,
            success: function ( response ) {
                callback.call( self.context || cb, response );
            }
        });
    }

    // ###Delete a group

    // Returns nothing

    _PieceMakerApi.prototype.deleteGroup = function ( groupId, cb ) {
        var callback = cb || noop;
        xhrDelete( this, {
            url: api.base_url + '/group/'+groupId,
            success: function ( response ) {
                callback.call( api.context || cb /*, response*/ );
            }
        });
    }

    // ###Get all users in this group

    // Returns:
    // A list of all users in that group

    _PieceMakerApi.prototype.listGroupUsers = function ( groupId, cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/group/'+groupId+'/users',
            success: function ( response ) {
                callback.call( api.context || cb, response );
            }
        });
    }

    // Events
    // --------

    // Events can be anything relating to time and a group

    // ###Get all events

    _PieceMakerApi.prototype.listEvents = function ( groupId, cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/group/'+groupId+'/events',
            success: function ( response ) {
                callback.call( api.context || cb, fixEventsResponseToArr( response ) );
            }
        });
    }

    // ###Get all events of a certain type

    _PieceMakerApi.prototype.listEventsOfType = function ( groupId, type, cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/group/'+groupId+'/events',
            data: {
                field: {
                    type: type
                }
            },
            success: function ( response ) {
                callback.call( api.context || cb, fixEventsResponseToArr( response ) );
            }
        });
    }

    // ###Get all events that have certain fields (id and value must match)

    _PieceMakerApi.prototype.listEventsWithFields = function ( /* groupId, id1, val1, id2, val2, …, cb */ ) {
        var groupId = arguments[0];
        var fields = {};
        if ( arguments.length > 3 ) {
            for ( var i = 1; i < arguments.length-1; i+=2 ) {
                fields[arguments[i]] = arguments[i+1];
            }
        } else {
            throw( 'Wrong parameter count' );
        }
        var cb = arguments[arguments.length-1];
        var callback = cb || noop;
        xhrGet( api, {
            url: api.base_url + '/group/'+groupId+'/events',
            data: {
                field: fields
            },
            success: function ( response ) {
                callback.call( api.context || cb, fixEventsResponseToArr( response ) );
            }
        });
    }

    // ###Get all events that happened within given timeframe

    _PieceMakerApi.prototype.listEventsBetween = function ( groupId, from, to, cb ) {
        var callback = cb || noop;
        xhrGet( api, {
            url: api.base_url + '/group/'+groupId+'/events',
            data: {
                from: jsDateToTs(from),
                to:   jsDateToTs(to)
            },
            success: function ( response ) {
                callback.call( api.context || cb, fixEventsResponseToArr( response ) );
            }
        });
    }

    // ###Get one event

    _PieceMakerApi.prototype.getEvent = function ( groupId, eventId, cb ) {
        var callback = cb || noop;
        xhrGet( api, {
            url: api.base_url + '/group/'+groupId+'/event/'+eventId,
            success: function ( response ) {
                callback.call( api.context || cb, expandEventToObject( fixEventResponse( response ) ) );
            }
        });
    }

    // ###Create one event

    _PieceMakerApi.prototype.createEvent = function ( groupId, eventData, cb ) {
        var data = convertData( eventData );
        if ( 'fields' in data ) {
            data['fields'] = JSON.stringify( data['fields'] );
        }
        var callback = cb || noop;
        xhrPost( this, {
            url: api.base_url + '/group/'+groupId+'/event',
            data: data,
            success: function ( response ) {
                callback.call( api.context || cb, expandEventToObject( fixEventResponse( response ) ) );
            }
        });
    }

    // ###Update one event

    _PieceMakerApi.prototype.updateEvent = function ( groupId, eventId, eventData, cb ) {
        var data = convertData( eventData );
        if ( 'fields' in data ) {
            data['fields'] = JSON.stringify( data['fields'] );
        }
        data['event_group_id'] = groupId;
        var callback = cb || noop;
        xhrPut( this, {
            url: api.base_url + '/event/' + eventId,
            data: data,
            success: function ( response ) {
                callback.call( api.context || cb, expandEventToObject( fixEventResponse( response ) ) );
            }
        });
    }

    // ###Delete one event

    _PieceMakerApi.prototype.deleteEvent = function ( groupId, eventId, cb ) {
        var callback = cb || noop;
        if ( (typeof eventId === 'object') && ('id' in eventId) ) eventId = eventId.id;
        xhrDelete( this, {
            url: api.base_url + '/event/' + eventId,
            success: function ( response ) {
                callback.call( api.context || cb , expandEventToObject( fixEventResponse( response ) ) );
            }
        });
    }

    /* _PieceMakerApi.prototype.listVideosForPiece = function ( pieceId, cb ) {
     var callback = cb || noop;
     xhrGet( this, {
     url: api.base_url + '/api/piece/'+pieceId+'/videos',
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    /* _PieceMakerApi.prototype.listEventsForVideo = function ( videoId, cb ) {
     var callback = cb || noop;
     xhrGet( this, {
     url: api.base_url + '/api/video/'+videoId+'/events',
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    /* _PieceMakerApi.prototype.listEventsBetween = function ( from, to, cb ) {
     var callback = cb || noop;
     xhrGet( this, {
     url: api.base_url + '/api/events/between/'+
     parseInt(from.getTime() / 1000) + '/' +
     parseInt(Math.ceil(to.getTime() / 1000)),
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    /* _PieceMakerApi.prototype.getEvent = function ( eventId, cb ) {
     var callback = cb || noop;
     xhrGet( this, {
     url: api.base_url + '/event/'+eventId,
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    /* _PieceMakerApi.prototype.createEvent = function ( data, cb ) {
     var callback = cb || noop;
     xhrPost( this, {
     url: api.base_url + '/event',
     data: data,
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    /* _PieceMakerApi.prototype.updateEvent = function ( eventId, data, cb ) {
     var callback = cb || noop;
     xhrPut( this, {
     url: api.base_url + '/event/'+eventId,
     data: data,
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     }*/

    /* _PieceMakerApi.prototype.deleteEvent = function ( eventId, cb ) {
     var callback = cb || noop;
     if ( (typeof eventId === 'object') && ('id' in eventId) ) eventId = eventId.id;
     xhrDelete( this, {
     url: api.base_url + '/event/'+eventId,
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    /* _PieceMakerApi.prototype.findEvents = function ( opts, cb ) {
     var callback = cb || noop;
     xhrPost( this, {
     url: api.base_url + '/api/events/find',
     data: opts,
     success: function ( response ) {
     callback.call( api.context || cb, response );
     }
     });
     } */

    // System related calls
    // ---------------------

    // ###Get the system (server) time

    _PieceMakerApi.prototype.getSystemTime = function ( cb ) {
        var callback = cb || noop;
        xhrGet( this, {
            url: api.base_url + '/system/utc_timestamp',
            success: function ( response ) {
                callback.call( api.context || cb, new Date( response.utc_timestamp * 1000 ));
            }
        });
    }

    // Additional client methods
    // --------------------------

    // ###Create a callback to be used for the API calls

    _PieceMakerApi.prototype.createCallback = function () {
        if ( arguments.length == 1 ) {

            return api.context[arguments[0]];

        } else if ( arguments.length >= 2 ) {

            var more = 1;
            var cntx = api.context, meth = arguments[0];

            if ( typeof arguments[0] !== 'string' ) { // then it's not a method name
                cntx = arguments[0];
                if ( typeof arguments[1] !== 'string' ) {
                    throw( 'createCallback(): if first argument is a target then the second needs to be a method name' );
                }
                meth = arguments[1];
                more = 2;
            }

            if ( arguments.length > more ) {
                var args = [];
                for ( var i = more; i < arguments.length; i++ ) {
                    args.push( arguments[i] );
                }
                return (function(c,m,a){
                    return function(response) {
                        if (response) a.unshift(response);
                        c[m].apply( c, a );
                    }
                })(cntx, meth, args);
            }
            else
                return cntx[meth];
        }
        else
            throw( "createCallback(): wrong number of arguments" );
    }

    return _PieceMakerApi;
})();