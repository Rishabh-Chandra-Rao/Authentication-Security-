require("dotenv").config();
// console.log(process.env) to know whether .env is working or not
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const encrypt = require("mongoose-encryption") ;
// const md5= require("md5");
// const bcrypt= require("bcrypt");
// const saltRounds = 10;

const app = express();
// console.log(process.env.SECRET);
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret:"Our Little secret.",
    resave:false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDB", {useNewUrlParser: true});

const userSchema =new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET ,encryptedFields: ["password"]});//this will encrypt all the data in DB even if we dont want it hence we need to add field for certain encryption

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User",userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

//passport-oauth-20
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo "
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", {scope:["profile"]})
);


app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){

    User.find({"secret":{$ne:null}})
    .then((foundUsers)=>{
        if (foundUsers) {
            res.render("secrets",{usersWithSecrets:foundUsers});
 }
    }).catch((err)=>{
                    console.log(err);
                })
    
    // if(req.isAuthenticated()){
    //     res.render("secrets");

    // }else{
    //     res.redirect("/login");
    // }
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");

    }else{
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret ;

    // console.log(req.user.id);
   
    User.findById(req.user.id)
    .then((foundUser)=>{
        if (foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save()
              res.redirect("/secrets");
 }
    }).catch((err)=>{
                    console.log(err);
                })
    
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.post("/register",function(req,res){

    User.register({username : req.body.username}, req.body.password, function(err, user){
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets");
            });
        }    
})
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const newUser = new User({
    //         email:req.body.username,
    //         // password: md5(req.body.password)
    //         password:hash
    //     });
  

  
    // newUser.save(function(err){
    //     if(err){
    //         console.log(err);
    //     }else{
    //         res.render("secrets")
    //     }
    // }); //callbacks are not accepted now
//     newUser.save().then(()=>{
//         res.render("secrets");
//     }).catch((err)=>{
//         console.log(err);
//     })
// });
});

app.post("/login",function(req,res){

    const user = new User({
        username:req.body.username,
        password:req.body.password 
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            });
        }
    });

    // const username = req.body.username;
    // const password = md5(req.body.password) ;
    // const password = (req.body.password) ;

    // User.findOne({email:username},function(err,foundUser){
    //     if(err){
    //         console.log(err);
    //     }else{
    //         if(foundUser){
    //             if(foundUser.password === password){
    //                 res.render("secrets")
    //             }
    //         }
    //     }
    // })

//     User.findOne({email:username})
//     .then((foundUser) => {
//         if(foundUser){

//             bcrypt.compare(password, foundUser.password, function(err,result) {
//                 if(result == true){
//                     res.render("secrets");
//                 }
//             });
//             // if(foundUser.password === password){
//             //     res.render("secrets");
//             // }
//         }
//    })
//    .catch((error) => {
       //When there are errors We handle them here

//        console.log(error);
//        res.send(400, "Bad Request");
//    });
});





app.listen(3000,function(){
    console.log("Server Started at port 3000.")
});


