// GLOBALS

var STRIPE_API = process.env['STRIPE_API'];
if (!STRIPE_API) throw "MISSING STRIPE_API ENV";

var _ = require('underscore')
  , parameterize = require('parameterize')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , gm = require('gm')
  , stripe = require('stripe')(STRIPE_API)
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , mailer = require('../lib/mailer');

// DB

mongoose.connect(null || 'mongodb://localhost/treat_street');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// SCHEMAS

var locationSchema = new Schema(
  {
    country: String,
    province: String,
    city: String,
    address: String,
    phone: String,
    email: String,
    url: String,
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

locationSchema.virtual('fullAddress').get(function() {
  return _.compact([
    this.address,
    this.city,
    this.province,
    this.country
  ]).join(', ');
});

var venueSchema = new Schema(
  {
    _user: { type: ObjectId, ref: 'User', index: true },
    name: String,
    description: String,
    menu: String,
    tags: { type: [ String ], index: true },
    locations: [ locationSchema ],
    images: Array,
    createdAt: { type: Date, default: Date.now },
    public: { type: Boolean, default: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

var userSchema = new Schema(
  {
    email: { type: String, index: true, unique: true },
    password: String,
    first_name: String,
    last_name: String,
    role: String, // in relation to Venue (ie: Owner, Server, etc.)
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('fullName').get(function() {
  return _.compact([
    this.first_name,
    this.last_name
  ]).join(' ');
});

var generateRedemptionCode = function(len) {
  // 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  len = len || 9;
  var code = '';
  var list = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (var i=0; i < len; i++) {
    code += list.charAt(Math.floor(Math.random()*list.length));
  }
  return code;
};

var ordersSchema = new Schema(
  {
    _venue: { type: ObjectId, ref: 'Venue', index: true },
    quantity: { type: Number, default: 1, min: 1, max: 20 },
    value: { type: Number, default: 50 },
    redemptionCode: {
      type: String,
      default: function() {
        return generateRedemptionCode(7);
      },
      unique: true,
      index: true,
      lowercase: true
    },
    redemptionStatus: {type: String, default: "active"},
    recipient: {
      name: String,
      email: String,
      phone: String,
      message: String
    },
    payment: {
      name: String,
      email: String,
      phone: String,
      card: {
        type: Object,
        default: {
          token: Object,
          charge: Object
        }
      }, // Stripe Token Response
      description: String,
      currency: { type: String, default: 'usd' }
    },
    createdAt: { type: Date, default: Date.now }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ordersSchema.virtual('cash').get(function() {
  if (this.payment.card.charge)
    return (this.value * 100 * this.quantity - this.payment.card.charge.fee) * 0.01;
});

ordersSchema.virtual('ccFee').get(function() {
  if (this.payment.card.charge)
    return this.payment.card.charge.fee * 0.01;
});

ordersSchema.virtual('total').get(function() {
  return this.value * this.quantity;
});

ordersSchema.virtual('tsFee').get(function() {
  return 0.10;
});

ordersSchema.virtual('restaurantRemainder').get(function() {
  var treatStreetFee = this.tsFee; // %10
  var totalValue = this.value * this.quantity;
  if (this.payment.card.charge)
    return (totalValue - (totalValue * treatStreetFee));
});

// MODELS

var User = mongoose.model('User', userSchema)
  , Venue = mongoose.model('Venue', venueSchema)
  , Order = mongoose.model('Order', ordersSchema);

// VALIDATIONS

Order.schema.path('redemptionStatus').validate(function(value) {
  return /active|redeemed|cancelled/i.test(value);
}, 'Invalid Redemption Status');

Order.schema.path('value').validate(function(value) {
  return /50|100|150/i.test(value);
}, 'Invalid Value');

Order.schema.path('redemptionCode').index({ unique: true });

// AUTHENTICATION SETUP

var masterAdmin = { id: "master_admin", masterAdmin: true };

// http://danialk.github.io/blog/2013/02/23/authentication-using-passportjs/
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(userId, done) {
  if (userId === "master_admin") {
    done(null, masterAdmin);
  } else {
    User.findById(userId, function(err, user) {
      done(err, user);
    });
  }
});

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {

    // Master Admin
    if (email === "admin@treatstreet.co" && password === "barbados!") {
      return done(null, masterAdmin);
    } else {
      // Restaurant Admin
      User.findOne({email: email}, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  }
));

// PUBLIC ENDPOINTS

// INDEX

exports.index = function(req, res) {
  // route by params
  res.json({hello: 'world'});
};

// AUTHENTICATION

exports.authenticate = passport.authenticate(
  'local',
  {
    successRedirect: '/#!/admin',
    failureRedirect: '/#!/admin/login',
    failureFlash: false
  }
);

exports.authenticateMaster = passport.authenticate(
  'local',
  {
    successRedirect: '/#!/master-admin',
    failureRedirect: '/#!/master-admin/login',
    failureFlash: false
  }
);

// AUTHENTICATED SESSION

// returns the User model for the authenticated session
exports.authenticatedSession = function(req, res) {
  if (req.session) {
    var sessionPassport = req.session.passport
      , userId = sessionPassport.user;
    if (!_.isEmpty(sessionPassport) && userId.user !== "master_admin") {
      User.findById(userId, function(err, user) {
        if (err) {
          res.json(err);
        } else {
          res.json(user);
        }
      });
    } else {
      // Can't use Master Admin as a valid "User", or in lieux of a Venue Admin
      res.send(401, { error: "You need to be a venue admin to access this page." });
    }
  } else {
    // Can't use Master Admin as a valid "User", or in lieux of a Venue Admin
    res.send(401, { error: "You need to be a venue admin to access this page." });
  }
};

exports.authenticatedMasterAdmin = function(req, res) {
  var sessionPassport = req.session.passport
    , userId = sessionPassport.user;

  if (!_.isEmpty(sessionPassport) && userId === "master_admin") {

    res.json({ masterAdmin: true });

  } else {

    res.send(401, { error: "You need to be a master admin to access this page." });

  }
};

// USERS

exports.users = function(req, res) {
  var method = req.route.method
    , id = req.params['id']
    , resource = req.body || {};

  if (method == 'get' && !id) {

    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    // GET ALL resources
    User.find({}, null, {sort: {createdAt: -1}}, function(err, users) {

      resource = {
        users: users
      };

      res.json(resource);
    });

  } else if (method == 'get' && id) {

    // GET ONE resource

    User.findById(id, function(err, user) {
      resource = user;
      res.json(resource);
    });

  } else if (method == 'post') {
    // CREATE resource

    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    var newUser = new User(req.body);
    newUser.save();
    res.json(req.body);

  } else if (method == 'put') {
    // UPDATE resource

    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    var user = req.body
      , id = user._id;

    // delete id as it can't be part of the updated obj
    delete user._id;

    User.findOneAndUpdate({"_id": id}, user, function(err, user) {
      if (err) console.log(err);
      res.json(user);
    });

  } else if (method == 'delete' && id) {
    // DELETE resource

    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    User.findByIdAndRemove(id, function(err, resource) {
      res.json(resource);
    });

  } else {

    // INVALID

  }
};

// VENUES

exports.venues = function(req, res) {
  var method = req.route.method
    , id = req.params['id']
    , resource = req.body || {};

  if (method === 'get' && !id) {
    // GET ALL resources

    Venue.find({}, null, {sort: {createdAt: -1}}, function(err, venues) {
      resource = {
        venues: venues
      };
      res.json(resource);
    });

  } else if (method === 'get' && id) {
    // GET ONE resource

    Venue.findById(id, function(err, venue) {
      resource = venue;
      res.json(resource);
    });

  } else if (method === 'post') {
    // CREATE resource
    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    var newVenue = new Venue(req.body);
    newVenue.save();
    res.json(req.body);

  } else if (method == 'put') {
    // UPDATE resource
    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    var venue = req.body
      , id = venue._id;

    // delete id as it can't be part of the updated obj
    delete venue._id;

    Venue.findOneAndUpdate({"_id": id}, venue, function(err, venue) {
      if (err) console.log(err);
      res.json(venue);
    });

  } else if (method === 'delete' && id) {
    // DELETE resource
    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    Venue.findByIdAndRemove(id, function(err, resource) {
      res.json(resource);
    });

  } else {

    // INVALID

  }
};

// ORDERS

exports.orders = function(req, res) {
  var method = req.route.method
    , id = req.params['id']
    , resource = req.body || {};

  if (method === 'get' && !id) {
    // GET ALL resources

    if (!isMasterAdminLoggedIn(req)) {
      res.send(401);
      return;
    }

    Order.find({}, null, {sort: {createdAt: -1}}, function(err, orders) {
      resource = {
        orders: orders
      };
      res.json(resource);
    });

  } else if (method === 'get' && id) {
    // GET ONE resource

    Order.findById(id, function(err, resource) {
      res.json(resource);
    });

  } else if (method === 'post') {
    // CREATE resource

    // Charge credit card before creating the order

    // SAMPLE
    // (Assuming you're using express - expressjs.com)
    // Get the credit card details submitted by the form
    // var stripeToken = request.body.stripeToken;

    // var charge = stripe.charges.create({
    //   amount: 1000, // amount in cents, again
    //   currency: "cad",
    //   card: stripeToken,
    //   description: "payinguser@example.com"
    // }, function(err, charge) {
    //   if (err && err.type === 'StripeCardError') {
    //     // The card has been declined
    //   }
    // });

    var stripeToken = req.body.payment.card.token.id;

    var description = JSON.stringify({
      value: req.body.value,
      quantity: req.body.quantity,
      payment: {
        name: req.body.payment.name,
        email: req.body.payment.email
      },
      recipient: {
        name: req.body.recipient.name,
        email: req.body.recipient.email
      }
    });

    // in cents, multiply by quantity
    var ammount = (req.body.value * 100) * req.body.quantity;

    var charge = stripe.charges.create({
      amount: ammount,
      currency: "usd",
      card: stripeToken,
      description: description
    }, function(err, charge) {
      if (err) {
        // Error
        console.log("CHARGE ERROR", err);
        res.json({error: err.message});
      } else if (charge) {
        // create the order
        var newOrder = new Order(req.body);
        // save Stripe charge
        newOrder.payment.card.charge = charge;
        // persist
        newOrder.save(function(err, resource){
          if (err) {
            res.json({error: err});
          } else {
            var order = resource;

            res.json(order);

            // send mail to admin, recipient and patron
            // get venue owner's details
            Venue.findOne({"_id": order._venue}, function(err, resource) {
              if (err) {
                console.log('Error', err);
              } else {
                var venue = resource;
                User.findOne({"_id": venue._user}, function(err, resource) {
                  if (err) {
                    console.log('Error', err);
                  } else {
                    var admin = resource;
                    mailer.sendNewOrderMailToVenueAdmin([admin.email], order);
                    mailer.sendNewOrderMailToPatron([order.payment.email], order, venue);
                    mailer.sendNewOrderMailToRecipient([order.recipient.email], order, venue);
                  }
                });
              }
            });
          }
        });
      } else {
        console.log("THIS SHOULDN'T HAPPEN", err, charge);
        res.json({
          message: "NO CHARGE, NO ERROR",
          error: err,
          charge: charge
        });
      }
    });

  } else if (method == 'put') {
    // UPDATE resource

    if (!isAuthorized(req)) {
      res.send(401, { error: "Not authorized." });
      return;
    }

    resource = req.body;
    id = resource._id;

    // delete id as it can't be part of the updated obj
    delete resource._id;

    Order.findOneAndUpdate({"_id": id}, resource, function(err, resource) {
      if (err) console.log(err);
      res.json(resource);
    });

  } else if (method === 'delete' && id) {
    // DELETE resource

    if (!isMasterAdminLoggedIn(req)) {
      res.send(401, { error: "Not authorized." });
      return;
    }

    Order.findByIdAndRemove(id, function(err, resource) {
      res.json(resource);
    });

  } else {

    // INVALID

  }
};

// FINDER - PUBLIC

exports.finder = function(req, res) {
  var method = req.route.method;

  if (method === 'get') {
    var model = req.params['model']
      , query = {}
      , query_key = req.params['key']
      , query_value = req.params['value']
      , query_limit = parseInt(req.params['limit'], 10) || 'all'
      , whitelist = [ 'Venue', 'User', 'Order' ];

    if (_.contains(whitelist, model)) {
      var Model = eval(model);

      query[query_key] = query_value;

      if (query_limit === 1) {
        // find one

        Model.findOne(query, function(err, result) {
          res.json(result);
        });

      } else if (query_limit !== 1 && query_limit !== 'all') {
        // TODO: find a (bracketed) limited set
      } else {
        // INVALID
        res.send(400, { error: "Invalid query" });
      }

    } else {

      res.send(400, { error: "Invalid Model" });

    }

  } else {

    // INVALID

  }
};

// RESTRICTED ENDPOINTS

// AUTHENTICATION

var isRestaurantAdminLoggedIn = function(req) {
  "use strict";
  if (!req) return;
  if (req.isAuthenticated()) {
    return req.user;
  } else {
    return false;
  }
};

var isMasterAdminLoggedIn = function(req) {
  "use strict";
  if (!req) return;
  if (req.isAuthenticated() && req.user.masterAdmin) {
    return req.user;
  } else {
    return false;
  }
};

// AUTHORIZATION

var isAuthorized = function(req) {
  "use strict";
  if (!req) return;
  if (isMasterAdminLoggedIn(req) || isRestaurantAdminLoggedIn(req)) {
    return true;
  } else {
    return false;
  }
};

// UPLOADER

exports.uploader = function(req, res) {

  // Check authentication
  if (!isAuthorized(req)) {
    res.send(401);
    return;
  }

  var tempPath = req.files.file.path
    , date = new Date()
    , epochNow = date.getTime().toString()
    , validFileTypes = ['.jpeg', '.jpg', '.png', '.gif']
    , fileExtLower = path.extname(req.files.file.name).toLowerCase()
    , newFileName = epochNow + '-' + _.random(1000, 9999)
    , fullFileName = newFileName + fileExtLower
    , directory = parameterize(req.body.objId)
    , directoryFinal = 'public/images/uploads/' + directory
    , webPath = '/images/uploads/' + directory + '/' + fullFileName;

  // make directory if missing
  mkdirp(directoryFinal, function(err) {
    var targetPath = path.resolve(directoryFinal + '/' + fullFileName);

    if (err) throw err;
    if (!directory || !directoryFinal) throw "We require more directories.";

    // validation
    if (_.contains(validFileTypes, fileExtLower)) {

      fs.rename(tempPath, targetPath, function(err) {
        if (err) {
          res.send(500, { error: 'Oops!' });
          throw err;
        } else {
          // resize and remove EXIF profile data
          gm(targetPath)
            .resize(800, 800, '^')
            .gravity('Center')
            .crop(800, 800)
            .noProfile()
            .write(targetPath, function(err) {
              if (!err) {
                // link to model
                Venue.findByIdAndUpdate(
                  req.body.objId,
                  {$push: {images: webPath}},
                  function(err, venue) {
                    res.send(200, {message: "Upload complete", image: webPath});
                  }
                );
              } else {
                console.log("ERROR processing image!", err);
                res.send(500, { error: 'Oops!' });
                throw err;
              }
            });

        }
      });

    } else {

      fs.unlink(tempPath, function () {
        if (err) {
          res.send(500, { error: 'Oops!' });
          throw err;
        } else {
          var message = ['Invalid file type. Only: ', validFileTypes.join(' ,'), ' allowed.'].join(' ');
          res.send(415, { error: message });
          console.error('Invalid file type. Only: ', validFileTypes.join(' ,'), ' allowed.');
        }
      });

    }
  });
};

// FINDER - RESTRICTED

exports.finderRestricted = function(req, res) {

  // Check authentication
  if (!isAuthorized(req)) {
    res.send(401, { error: "You need to be authorized to access this page." });
    return;
  }

  var method = req.route.method;

  if (method === 'get') {
    var model = req.params['model']
      , query = {}
      , query_key = req.params['key']
      , query_value = req.params['value']
      , query_limit = parseInt(req.params['limit'], 10) || 'all'
      , whitelist = [ 'Venue', 'User', 'Order' ];

    if (_.contains(whitelist, model) && query_key && query_value) {
      var Model = eval(model);

      query[query_key] = query_value;

      if (query_limit === 1) {
        // find one

        Model.findOne(query, function(err, result) {
          res.json(result);
        });

      } else if (query_limit !== 1 && query_limit !== 'all') {
        // TODO: find a limited set
      } else if (query_limit === 'all') {
        // find all

        Model.find(query, null, {sort: {createdAt: -1}}, function(err, result) {
          res.json(result);
        });

      }

    } else {

      res.json({error: "Invalid Model"});

    }

  } else {

    // INVALID

  }

};
