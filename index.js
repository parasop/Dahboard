const express = require("express");
const app = express();
const data = require("./data.json")
const config = require("./config.json");
require("dotenv").config();


//middlewares
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const DisocrdStrategy = require("passport-discord").Strategy;
const passport = require("passport");


passport.use(
    // create discord passport here
    new DisocrdStrategy({
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: config.callbackURL,
        //right now we require only two scope
        scope: ["identify", "guilds",]

    },

        function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
                return done(null, profile);
            });
        })
)


//lets enable session
app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: "mysecretpleasedontshareitlmao",
    resave: false,
    saveUninitialized: false

}))


//middleware for passport
app.use(passport.initialize());
app.use(passport.session());


//passport serialize and deserialize
passport.serializeUser(function (user, done) {

    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

module.exports.Dashboard = (client) => {

    app.get("/login", async (req, res, next) => {next();}, passport.authenticate("discord"))

    app.get("/logout", (req, res) => {

            req.session.destroy(() => {})
    })


    app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), function (req, res) {

        res.redirect("/");
     });



    app.set("view engine", "ejs");

    app.get("/", (req, res) => {

        return res.render("index", { data, user: req.user });
    })

    app.get("/dashboard", async(req,res)=>{


        if(!req.user) return res.redirect("/login");
        let guilds = req.user.guilds.filter(g => g.permissions & 8);


        return res.render("dashboard", { data, user: req.user, guilds ,bot:client,config});
    })



    app.listen(process.env.PORT || 3000, () => {
        console.log(`App is running on port ${process.env.PORT}`)
    })



}