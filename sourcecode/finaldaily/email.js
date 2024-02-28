const nodemailer = require('nodemailer');
const ejs = require('ejs');

const transport = nodemailer.createTransport({
  host: 'imap.ethereal.email',
  port: 993,
  auth: {
    user: 'ivah71@ethereal.email',
    pass: 'uEAQ7vxVvTHRbTkwtt'
  }
});

const sendEmail = (receiver, subject, content) => {
  ejs.renderFile(__dirname + '/templates/welcome.ejs', { receiver, content }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      var mailOptions = {
        from: 'me <ivah71@ethereal.email>',
        to: receiver,
        subject: subject,
        html: data
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
      });
    }
  });
};

module.exports = {
  sendEmail
};