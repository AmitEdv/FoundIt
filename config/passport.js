var passport = require('passport');//not setting up a new one
//is exactly the same one that is required in app.js
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;


passport.serializeUser(function(user, done){
	done(null, user.id);//whenever you want to store user in session, serialize it by id
});//tells how to store the user in the session


//retrieve user when needed
passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		done(err, user);
	}); //finding in mongoose
});

//below are strategies

//to create a new user
passport.use('local.signup', new LocalStrategy({
	//we can use username instead of email
	usernameField: 'email',//key that the package expects to get 
	passwordField: 'password',
	passReqToCallback: true // in the call back we'll get the request, email, password
	//done - if was successful
}, function(req, email, password, done){
	var checkSchema = {
	 'email': {// if there is error, will return the second param
		notEmpty: true,
		optional: {
		  options: { checkFalsy: true } // or: [{ checkFalsy: true }] 
		},
		isEmail: {
		  errorMessage: 'Invalid Email'
		}
	  },
	  'password': {
		notEmpty: true,
		isLength:{
			options: [{min: 4, max: 15}],
			errorMessage: 'Invalid password, must be between 4-15 characters ' // Error message for the parameter 
		}
	  }
	};
	
	req.checkBody(checkSchema);
	req.checkBody( 'fname', 'Please enter your first name').notEmpty();
	req.checkBody( 'lname', 'Please enter your last name').notEmpty();
	req.checkBody('password', 'Passwords do not match').equals(req.body.passwordConfirm);
	req.checkBody( 'phone', 'Enter a valid IL phone number ').isMobilePhone('he-IL');
	//handling errors
	var errors = req.validationErrors();//will get the two errors above, if there is
	if (errors){
		var messages = [];
		errors.forEach(function(error){
			messages.push(error.msg);//we want to add only the message
			console.log(error.msg);
		});
		return done(null, false, req.flash('error', messages)); //we return false because it wasn't succesfful
	}
	User.findOne({'email': email}, function(err, user){
		//checking if user already exists
		if (err){
			return done(err);
		}
		if (user){
			return done(null, false, {message: 'E-mail is already in use.'});//null- no errors, false - no retrieve objects
		}//message will be flash message which will be stored in the session which we can output in view
		
		//else - the user doesn't exist
		var newUser = new User();
		
		newUser.email = email;
		newUser.fname = req.body.fname;
		newUser.lname = req.body.lname;
		newUser.phone = req.body.phone;
		//we want to encrypt the password
		newUser.password = newUser.encryptPassword(password); //not encrypted
		//now we save to database
		newUser.save(function(err, result){
			if (err){
				return done(err);
			}
			//if no error
			return done(null, newUser); //null - no error
		});
	});
}));

passport.use('local.signin', new LocalStrategy({
	usernameField: 'email',//key that the package expects to get 
	passwordField: 'password',
	passReqToCallback: true // in the call back we'll get the request, email, password
	//done - if was successful
}, function(req, email, password, done){
		req.checkBody('email', 'Invalid email').notEmpty().isEmail();// if there is error, will return the second param
	req.checkBody('password', 'Invalid password, must at least 4 characters').notEmpty();//password needs to be longer than 4 digits
	
	//handling errors
	var errors = req.validationErrors();//will get the two errors above, if there is
	if (errors){
		var messages = [];
		errors.forEach(function(error){
			messages.push(error.msg);//we want to add only the message
		});
		return done(null, false, req.flash('error', messages)); //we return false because it wasn't succesfful
	}
	User.findOne({'email': email}, function(err, user){
		//checking if user already exists
		if (err){
			return done(err);
		}
		if (!user){
			return done(null, false, {message: 'E-mail does not exist.'});//null- no errors, false - no retrieve objects
		}//message will be flash message which will be stored in the session which we can output in view
		
		if (!user.validPassword(password)){
			return done(null, false, {message: 'Password is incorrect.'});
		}
		return done(null, user);
	});
	
}));