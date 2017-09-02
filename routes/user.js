var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var qrCode = require('qr-image');
var multer = require('multer');
var fs = require('fs');
var cloudinary = require('cloudinary');
var stream = require('stream');

var csrfProtection = csrf();
router.use(csrfProtection);

cloudinary.config({
    cloud_name: 'dwaomktcu',
    api_key: '568693776788277',
    api_secret: 'jkPr2BS5-A7NBVIBTf84cq4E2wU'
});

//we want to import after packages
var QR = require('../models/qr');

//we are grouping middleware by logged in and not logged in
//if a user is already logged in - meaning can't access sign in or sign up
router.get('/profile', isLoggedIn, function(req, res, next) {
	res.render('user/profile', { name: req.user.fname});
});


router.use('/delete/:id',isLoggedIn, function(req, res) {
	var id = req.params.id;
	QR.findOne({_id: id}, function(err,doc){
		console.log(id);
		if (err){
			console.log(err);
			return res.status(500).send();//need to handle it
		}
        var fs = require('fs');
        //fs.unlinkSync("C:/foundIt/public/images/"+id+".png");
        QR.findOneAndRemove({_id: id}, function(err,doc){
            console.log(id);
            if (err){
                console.log(err);
                return res.status(500).send();//need to handle it
            }
            req.flash('success', 'Successfully deleted seleceted QR Code!');
            res.redirect('/user/items');
        });
	});
});

router.get('/items',isLoggedIn, function(req, res, next) {
	QR.find({user: req.user}, function(err, docs){
		if (err){
			return res.write('Error');//need to handle it
		}// NEED TO DELETE THE IMAGE FROM THE SERVER
		var messages = req.flash('success');//possible flash messages stored in request
		//messages will be stored under error
		//will be stored under error if comes from passport
		res.render('user/items', { title: 'Items list' , items: docs, csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0, 
			noItems: docs.length == 0});
	});
});

router.get('/add-qrcode',isLoggedIn, function(req, res, next) {
	res.render('user/add-qrcode', {csrfToken: req.csrfToken()});
});

router.post('/add-qrcode',isLoggedIn, function(req, res, next) {
	//adding qrcode
	console.log(req.body.collapseGroup);
	var tempResult = req.body.collapseGroup; 
	var tome, meother, other, phone, email;
	if (tempResult == 1){
			tome = true;
			meother = false;
			other = false;
			phone = 0;
			email = 0;
		}
	else if (tempResult == 2){
		 tome = false;
		 meother = true;
		 other = false;
		 phone = req.body.otherphone;
		 email = req.body.otheremail;
	}
	else {
		tome = false;
		meother = false;
		other = true;
		phone = req.body.otherphone; //need to validate phone and email - TODO
		email = req.body.otheremail;
	}
	var qr = new QR();
    qr.user = req.user;
    //var qrImgBuffer = qrCode.imageSync("https://found-it-mta.herokuapp.com/find/"+String(qr._id), { type: 'png' });
    //qrPng.pipe(require('fs').createWriteStream("./public/images/"+String(qr._id)+".png"));
	//qr.img.data = qrImgBuffer;
    //qr.img.contentType = 'image/png';

    // change image name
    // var stream = cloudinary.v2.uploader.upload_stream("DOG", function(error, result){console.log(result)});
    // var qrBuffer = qrCode.imageSync("https://found-it-mta.herokuapp.com/find/"+String(qr._id), { type: 'png' });
    // stream.end(new Buffer(qrBuffer));
	qr.destPath="https://found-it-mta.herokuapp.com/find/"+String(qr._id);
    qr.imagePath="https://found-it-mta.herokuapp.com/qrc?text="+qr.destPath;
    qr.title = req.body.name;
	qr.sendToMe = tome;
	qr.sendMeOther = meother;
	qr.sendOther = other;
	qr.otherPhone = phone;
	qr.otherEmail = email;

	qr.save(function(err, result){
		console.log(err);
		if (err){
			return res.redirect('/user/add-qrcode'); 
		}
		req.flash('success', 'Successfully created a new QR Code!');
		res.redirect('/user/items');
	});//we want to save it to user list -maybe TODO

});

router.get('/logout', isLoggedIn, function(req, res, next){
	req.logout();
	res.redirect('/');
});

router.use('/', notLoggedIn, function(req, res, next){
	//if user isn't logged in will check the below if matches
	next();
});
//all middlewares below are for those who aren't logged in

router.get('/signup', function(req, res, next){
	var messages = req.flash('error');//possible flash messages stored in request
	//messages will be stored under error
	//will be stored under error if comes from passport
	res.render('user/sign-up', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});

//using a middle-ware passport.authenticate
router.post('/signup', passport.authenticate('local.signup', {
	successRedirect: '/user/profile',
	failureRedirect: '/user/signup',
	failureFlash: true //to flash a message
}));

router.get('/signin', function(req, res, next) {
	var messages = req.flash('error');
	res.render('user/sign-in', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});

router.post('/signin', passport.authenticate('local.signin', {
	successRedirect: '/user/profile',
	failureRedirect: '/user/signin',
	failureFlash: true //to flash a message
}));

module.exports = router;

//passport manages the authentication
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()){ //function added by passport
		return next();
	}
	res.redirect('/');
}

function notLoggedIn(req, res, next){
	if (!req.isAuthenticated()){ //function added by passport
		return next();
	}
	res.redirect('/');
}
