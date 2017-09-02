var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var nodemailer = require('nodemailer');
var QR = require('../models/qr');
var User = require('../models/user');
var qrCode = require('qr-image');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'foundit.mta@gmail.com',
        pass: 'founditproject'
    }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Found It!' });
});
router.get('/howToUse', function(req, res, next) {
    res.render('howToUse');
});

router.get("/qrc", function(req, res, next) {
    var text = req.query.text;
    res.setHeader("Content-Type", "image/png");
    res.send(qrCode.imageSync(text, {type: "png"}));
});

router.get('/find/:id',function(req,res,next){
    res.render('find', {id:req.params.id});
});
router.post('/find/:id', function(req, res, next) {
    var qrId=req.params.id;
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
            var sendToMe = false;
            var whoToSend = docIn.email;
            if (doc.sendToMe || doc.sendOther) {
                if (doc.sendOther) {
                    whoToSend = doc.otherEmail;
                }
                var mailOptions = {
                    from: 'foundit.mta@gmail.com',
                    to: whoToSend,
                    subject: 'Your ' + desc + ' Has Been Found!',
                    text: msg
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                })
            }
            else {
                var mailOptions = {
                    from: 'foundit.mta@gmail.com',
                    to: whoToSend,
                    subject: 'Your ' + desc + ' Has Been Found!',
                    text: msg
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        var mailOptions = {
                            from: 'foundit.mta@gmail.com',
                            to: doc.otherEmail,
                            subject: 'Your ' + desc + ' Has Been Found!',
                            text: msg
                        };
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        })
                    }
                })
            }
            res.redirect('/');
        });
    });

});

module.exports = router;
