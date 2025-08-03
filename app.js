const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose= require('passport-local-mongoose');

 app.set('view engine', 'ejs');
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(express.static('public'));

app.set('trust proxy', 1) 
app.use(session({
  secret: 'Abhilash_ka_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize()); //Hey Express, please enable Passport.
app.use(passport.session());// Lets Passport store user data in the session (so they stay logged in).users don’t get logged out every time they refresh
 

 mongoose.connect('mongodb://localhost:27017/userDB6');

 const user_schema= new mongoose.Schema({
    email: String,
    password: String
 })

user_schema.plugin(passportLocalMongoose);// this line allows your userSchema to use all the built-in functions that passport-local-mongoose provides
const user_model=mongoose.model('user',user_schema);

passport.use(user_model.createStrategy());
//Check username and password when users log in.
//Handle the complexity of password hashing, session management
passport.serializeUser(user_model.serializeUser());//Samosha bna rhe hai,aloo bhar rhe hai.
//Purpose: Tells Passport how to save the user data in the session.
//What it does: Stores only the user ID (or minimal info) in the session,puree object ko nhi store krta.
passport.deserializeUser(user_model.deserializeUser());//samosa phod ke aaloo nikal rhe hai.
//Purpose: Tells Passport how to retrieve the full user details from the session data (like the user ID).
//What it does: Uses the stored ID to fetch the full user object from the database and attach it to req.user.

 app.get('/', (req, res) => {
    res.render('home'); 
    })

 app.get('/login', (req, res) => {
    res.render('login');   
    })

app.get('/register', (req, res) => {
    res.render('register');   
    });
 
app.get('/submit', (req, res) => {
    res.render('submit');   
    })
 
app.get('/secrets', (req, res) => { // Koi banda http://localhost:3000/secrets type krega aur wo secret page access kr lega.aisa na ho iske liye .isAuthenticated() ka use krte hai.
    if (req.isAuthenticated()) {   // whi banda jo login hai ya registered hai(i.e,authenticated) ,secret page ko render kr skta hai.
        res.render('secrets');     //jb tk register hai ya login hai tabhi tk session active hai. req.logout krte hi session will end ,see below code.
    }
        else{
        res.redirect('/login');
    }
})

app.get('/logout', (req, res, next) => {
    req.logout((err) => {   // .logout kr ke session ko end kr do(Passport removes the session),ek baari session end ho gya koi bhi banda  http://localhost:3000/secrets type krke secret page access nhi kr paega.
        if (err) {
            return next(err); // If there's an error during logout, pass it to the next error-handling middleware
        }
        res.redirect('/'); // Redirect to the home page after successful logout
    });
});


app.post('/register',async(req,res)=>{
user_model.register({username:req.body.username},req.body.password,async(err,user)=>{
// user_model.register() is a method provided by passport-local-mongoose.
// It creates a new user with the given username and password, and saves it to the database.
// It automatically handles password hashing, so you don't need to hash the password manually.

if (err) {
    console.log(err);
    res.redirect('/register');  // If there's an error (e.g., username already exists), redirect to the registration page.
} else {
    passport.authenticate('local')(req, res, () => {   
// passport.authenticate('local') is a middleware function provided by Passport.js (via passport-local-mongoose).
// It authenticates the user using the local strategy (username and password).
// This checks that provided username and password MongoDB me already exist kr rha hai ya nhi (which was just created in this).
// Since we just created the user, the password and username will match, so authentication is successful.
        res.redirect('/secrets');  // Redirect to the 'secrets' page after successful authentication.
    });
}

})
})

app.post('/login',async(req,res)=>{
    try{
    const e_mail=req.body.username;
    const pass_word=req.body.password;

    const user1=new user_model({
        username: e_mail,
        password: pass_word
    
    });
    req.login(user1,async(err)=>{
//req.login(user1, callback) is a Passport.js method that logs in the user by establishing a session for them.
//user login hona chahte hai with document having username and password.
//  agar koi faltu error(like email without @)nhi hua then else part me jao.          
        if(err){
            console.log(err);
        }
        else{
        passport.authenticate('local')(req, res, () => {
//ye( passport.authenticate('local')) sure karega ki username and password jo tum abhi login krte time diye ho wo already MongoDB me exist kr rha hai ya nhi.
//agar kr rha hai then you will be redirected to secret page.otherwise Passport's authentication process will send -->>"unauthorized"              
        res.redirect('/secrets');
        }
        )}
    })
}
    catch(err){
        console.log(err);
    }
})
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});