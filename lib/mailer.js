var nodemailer = require('nodemailer')
    , _ = require('underscore');

// Create a SMTP transport object
var transport = nodemailer.createTransport("SMTP", {
  service: 'Zoho',
  auth: {
    user: "email@example.com",
    pass: "password"
  }
});

// Message object
var message = {
  // sender info
  from: 'TreatStreet <email@example.com>',

  // Comma separated list of recipients
  to: '',

  // Subject of the message
  subject: '',

  headers: {
    'X-Laziness-level': 1000
  },

  // plaintext body
  // text: '',

  // HTML body
  html: '<img src="cid:logo@treatstreet"/>',
};

var sendMail = function(message) {
  transport.sendMail(message, function(error){
    if (error) {
      console.log('Error occured', error.message);
    } else {
      console.log('Message sent successfully!');
    }
    // if you don't want to use this transport object anymore, uncomment following line
    // transport.close(); // close the connection pool
  });
};

var composeMail = function(recipients, subject, messageHTML) {
  message.to = recipients;
  message.subject = subject;
  message.html = messageHTML;
  return message;
};

// MAIL MESSAGES

// HELPERS

var logoImg = '<img alt="TreatStreet.co" src="https://treatstreet.co/images/treat-street-logo-small.png"/>';

var hr = "<hr style='background-color:#52b0a7;border:none;height:1px;'>";

var termsAndConditions = "<p><i>* Gift card is one time use only. Please redeem on your next visit in full.</i></p>";

var signature = [
  hr,
  "<p>",
    "<i>",
      "<b>", "<a href='https://treatstreet.co'>TreatStreet.co</a>", "</b>",
      "<br>",
      "Easy restaurant reservations in Barbados for your friends & family – from anywhere in the world!",
      "<br>",
      "1. Pick a venue — 2. Select your gift voucher value & quantity — 3. Pay online, and make your loved one happy :)",
    "</i>",
  "</p>",
].join('');

// MESSAGES

// admin of venue for which the gift card was purchased
exports.sendNewOrderMailToVenueAdmin = function(recipients, order) {
  if (_.isArray(recipients) && _.isObject(order)) {
    var recipientsFormatted = recipients.join(', ');

    var messageBody = [
      logoImg,
      "<h2>", order.payment.name, " has purchased a gift card for ", order.recipient.name, "</h2>",
      "<p>", "Congratulations on your sale! :)", "</p>",
      hr,
      "<p>", "Gift card quantity: <b>", order.quantity, "</b>.", "</p>",
      "<p>", "Each quantity represents a menu value of: <b>$", order.value, " USD</b> (or equivalent).", "</p>",
      "<p>", "Please honour ", order.recipient.name, "'s gift card on their next visit to your venue.", "</p>",
      "<p>", "The gift card code is: <b>", order.redemptionCode, "</b>.", "</p>",
      "<p>", "Once the recipient has used their gift card, we will send you a money transfer for its value minus fees.", "</p>",
      hr,
      "<p>",
        "View order details: <a href='https://treatstreet.co/#!/orders/", order._id ,"'>",
          "https://treatstreet.co/#!/orders/", order._id,
        "</a>",
      "</p>",
      "<p>", "Manage all orders on your Restaurant Manager page: <a href='https://treatstreet.co/#!/admin'>https://treatstreet.co/#!/admin</a>", "</p>",
      "<p>", "If you require assistance or have questions please feel free to reply to this email!", "</p>",
      "<p><i>", "Thank you for using TreatStreet!", "</i></p>",
      termsAndConditions,
      signature,
      ""
    ].join('');

    var mail = composeMail(
      recipientsFormatted,
      'TreatStreet: Someone purchased a gift card for your venue!',
      messageBody
    );

    return sendMail(mail);
  } else {
    throw new Error("Mail send error: 'recipients' or 'order' must be of the right types.");
  }
};

// the person that paid for the gift card
exports.sendNewOrderMailToPatron = function(recipients, order, venue) {
  if (_.isArray(recipients) && _.isObject(order) && _.isObject(venue)) {
    var recipientsFormatted = recipients.join(', ');

    var messageBody = [
      logoImg,
      "<h2>", "Thank you ", order.payment.name, "!", "</h2>",
      "<p>", "You have recently purchased a gift card from TreatStreet.", "</p>",
      "<p>", "Gift card details:", "</p>",
      "<p>",
        "Value: ", "<b>$", order.value, " USD</b> (or equivalent menu value)",
        ", quantity: ", "<b>", order.quantity, "</b> (use one or more per person, if available)",
        ", valid at venue: ", "<b>", venue.name, "</b>",
      ".</p>",
      "<p>", "Gift card ID: ", "<b>", order.redemptionCode, "</b>", " sent to: ", order.recipient.name, ".</p>",
      hr,
      "<p>", "We have let ", order.recipient.name, " know about this and have left them instructions on what to do.", "</p>",
      "<p>", "If you wish, you can let them know they should present their gift card ID <b>", order.redemptionCode, "</b> on their next visit to the restaurant.", "</p>",
      termsAndConditions,
      signature,
      ""
    ].join('');

    var mail = composeMail(
      recipientsFormatted,
      'TreatStreet: Thank you for purchasing a gift card!',
      messageBody
    );

    return sendMail(mail);
  } else {
    throw new Error("Mail send error: 'recipients', 'order' or 'venue' must be of the right types.");
  }
};

// the person who received the gift card
exports.sendNewOrderMailToRecipient = function(recipients, order, venue) {
  if (_.isArray(recipients) && _.isObject(order) && _.isObject(venue)) {
    var recipientsFormatted = recipients.join(', ');

    var addresses = [];
    _.each(venue.locations, function(location) {
      addresses.push(location.fullAddress);
    });

    var messageBody = [
      logoImg,
      "<h2>",
        "You have received a gift card for <b>", venue.name, "</b>",
        " from <b>", order.payment.name, "</b>!",
      "</h2>",
      "<p>", "Redeem at location: ", addresses.join('; '), "</p>",
      "<p>", "Gift card details:", "</p>",
      "<p>",
        "Value: ", "<b>$", order.value, " USD</b> (or equivalent menu value)",
        ", quantity: ", "<b>", order.quantity, "</b> (use one or more per person, if available)",
        ", valid at venue: ", "<b>", venue.name, "</b>",
      ".</p>",
      "<p>", "Your gift card: ", "<b>", order.redemptionCode, "</b>", " was purchased by: ", order.payment.name, ".</p>",
      hr,
      "<p>", "Instructions:", "</p>",
      "<p>",
        "To redeem your gift card at ", venue.name, ", present your unique gift card ID: ",
        "<b>", order.redemptionCode, "</b>", " on your next visit.",
      "</p>",
      "<p>", "If you require assistance or have questions please feel free to reply to this email!", "</p>",
      termsAndConditions,
      signature,
      ""
    ].join('');

    var mail = composeMail(
      recipientsFormatted,
      'TreatStreet: You have received a gift card!',
      messageBody
    );

    return sendMail(mail);
  } else {
    throw new Error("Mail send error: 'recipients', 'order' or 'venue' must be of the right types.");
  }
};
