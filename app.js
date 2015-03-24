var express = require('express')
  , api = require('./controllers/api')
  , frontend = require('./controllers/frontend')
  , http = require('http')
  , passport = require('passport')
  , path = require('path')
  , RedisStore = require('connect-redis')(express);


  // , heapdump = require('heapdump')
  // , nextMBThreshold = 0

// DEBUGGING

// setInterval(function () {
//   var memMB = process.memoryUsage().rss / 1048576;
//   if (memMB > nextMBThreshold) {
//     process.chdir(path.join(__dirname, 'uploads'));
//     heapdump.writeSnapshot();
//     nextMBThreshold += 100;
//   }
// }, 6000 * 2);

// SETUP

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// BASIC AUTHENTICATION

// http://blog.modulus.io/nodejs-and-express-basic-authentication
// app.use(express.basicAuth('admin', 'barbados'));

// MIDDLEWARE

app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public'))); // static line must come before app.router
app.use(express.bodyParser({uploadDir:'./uploads/'}));
app.use(express.methodOverride());
app.use(express.cookieParser('93835D27ECD9951713DACDD5755A52064BD070E65272F6731B3131A995FE4C6F'));
// expire 30 days from now
// expires: new Date(Date.now() + (30 * 86400 * 1000))
app.use(express.session({
  store: new RedisStore({ host: "localhost", port: 6379 }),
  secret: 'SECRETZ!',
  key: '_treat_street_session'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// ROUTES

// AUTHENTICATION

app.post('/login', api.authenticate);
app.post('/login-master', api.authenticateMaster);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// API

// index
app.get('/api', api.index);

// authenticated session
app.get('/api/authenticated_session', api.authenticatedSession);

// master authenticated session
app.get('/api/authenticated_session/admin', api.authenticatedMasterAdmin);

// venues
app.all('/api/venues/:id?', api.venues);

// users
app.all('/api/users/:id?', api.users);

// orders
app.all('/api/orders/:id?', api.orders);

// finder
app.get('/api/find/:model/:key/:value/:limit', api.finder);

// finder restricted
app.get('/api/find_restricted/:model/:key/:value/:limit', api.finderRestricted);

// uploader
app.post('/api/upload', api.uploader);


// FRONTEND
app.get('*', frontend.index);


// SERVER
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
