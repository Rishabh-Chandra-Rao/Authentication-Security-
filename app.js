require("dotenv").config();
// console.log(process.env) to know whether .env is working or not
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption") ;

const app = express();
console.log(process.env.SECRET);
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
    extended:true
}));

mongoose.connect("mongodb://0.0.0.0:27017/userDB", {useNewUrlParser: true});

const userSchema =new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET ,encryptedFields: ["password"]});//this will encrypt all the data in DB even if we dont want it hence we need to add field for certain encryption

const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User({
        email:req.body.username,
        password: req.body.password
    })
    // newUser.save(function(err){
    //     if(err){
    //         console.log(err);
    //     }else{
    //         res.render("secrets")
    //     }
    // }); //callbacks are not accepted now
    newUser.save().then(()=>{
        res.render("secrets");
    }).catch((err)=>{
        console.log(err);
    })
    
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password ;

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

    User.findOne({email:username})
    .then((foundUser) => {
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
   })
   .catch((error) => {
       //When there are errors We handle them here

       console.log(err);
       res.send(400, "Bad Request");
   });
})





app.listen(3000,function(){
    console.log("Server Started at port 3000.")
});


