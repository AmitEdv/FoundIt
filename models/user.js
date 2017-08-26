var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');//to hash password

var userSchema = new Schema({
	email: {type: String, required: true},
	password: {type: String, required: true},
	fname: {type: String, required: true},
	lname: {type: String, required: true},
	phone: {type: Number, required: true}
});
//to create a hash password CSRF Protection
//so that our session won't get stolen
//or if it gets stolen, other users won't be able to use this session


//helper methods to encrypt passwords
userSchema.methods.encryptPassword = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(5),null); //creating encrypted password
};

//helper method to check if a password matches 
userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.password);
	//"this" refers to the user who entered the password
};
module.exports = mongoose.model('User', userSchema);