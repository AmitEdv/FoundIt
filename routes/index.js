var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var nodemailer = require('nodemailer');
var QR = require('../models/qr');
var User = require('../models/user');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'foundit.mta@gmail.com',
        pass: 'founditmta'
    }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FoundIt!' });
});

router.get('/qrc', function(req, res, next){
    res.send(req.query.data);
});

router.get('/find/:id',function(req,res,next){
    res.render('find', {id:req.params.id});
});
router.post('/find/:id', function(req, res, next) {
    var qrId=req.params.id;
    //var userEmail;
    //var userId;
    //var desc;
    var msg=req.body.msg;
    QR.findById(qrId,function(err,doc) {
        console.log(qrId);
        if (err) {
            console.log(err);
            return res.status(500).send();//need to handle it
        }
        var userId= doc.user;
        console.log(userId);
        var desc= doc.title;
        console.log(desc);
        User.findById(userId,function(err,docIn) {
            console.log(userId);
            if (err) {
                console.log(err);
                return res.status(500).send();//need to handle it
            }
           var userEmail=docIn.email
           var mailOptions = {
               from: 'foundit.mta@gmail.com',
               to: userEmail,
               subject: 'Your '+desc+' Has Been Found!',
               text: msg
           };
           transporter.sendMail(mailOptions, function(error, info) {
               if (error) {
                   console.log(error);
               } else {
                   console.log('Email sent: ' + info.response);
               }
           })
           req.flash('success', 'Thank You. Your message was successfully sent!');
           res.redirect('/');
        });
    });

});

module.exports = router;
