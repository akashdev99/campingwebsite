var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    =require("passport"),
    localStratergy=require("passport-local"),   //it will prevent any duplicate username
    localMongoose=require("passport-local-mongoose"),
    
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    seedDB      = require("./seeds"),
    user        = require("./models/user");
    


    
mongoose.connect("mongodb://localhost/yelp_camp_6");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(function(req,res,next)//runs onalll routes and therefore need not explicity send it
    { 
       res.locals.currentUser=req.user;
       next();
    });
    
//PASSPORT CONFIG
app.use(require("express-session")({
    secret:"akash is a good boy",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

passport.use(new localStratergy(user.authenticate()));


seedDB();

app.get("/", function(req, res){
    res.render("landing");
});

//INDEX - show all campgrounds
app.get("/campgrounds", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
          res.render("campgrounds/index",{campgrounds:allCampgrounds,currentUser:req.user});
       }
    });
});

//CREATE - add new campground to DB
app.post("/campgrounds", function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newCampground = {name: name, image: image, description: desc}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
});

//NEW - show form to create new campground
app.get("/campgrounds/new", function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});


// ====================
// COMMENTS ROUTES
// ====================

app.get("/campgrounds/:id/comments/new", isLoggedIn  ,function(req, res){
    // find campground by id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});

app.post("/campgrounds/:id/comments",isLoggedIn, function(req, res){
   //lookup campground using ID
   Campground.findById(req.params.id, function(err, campground){
       if(err){
           console.log(err);
           res.redirect("/campgrounds");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               campground.comments.push(comment);
               campground.save();
               res.redirect('/campgrounds/' + campground._id);
           }
        });
       }
   });
   //create new comment
   //connect new comment to campground
   //redirect campground show page
});


//AUTH ROUTES
app.get("/register",function(req,res)
    {
         res.render("register");
    });
app.post("/register",function(req,res)
    {
       user.register(new user({
            username:req.body.username
            }),req.body.password,function(err,User)
            {
                if(err)
                   {
                       res.redirect("/register")
                       
                   }
                passport.authenticate("local")(req,res,function()
                   {
                     res.redirect("/campgrounds");   
                   });
            });
       
    });
    
//login
app.get("/login",function(req,res)
    {
       res.render("login");  
    });
app.post("/login",passport.authenticate("local",{
                             successRedirect:"/campgrounds",
                             failureRedircet:"/login"
                             
                  }),function(req,res)
    { 
         
       
    });
    
//logout

app.get("/logout",function(req,res)
   { 
      req.logout(); 
      res.redirect("/campgrounds");
   });
   
   
function isLoggedIn(req,res,next)
         {
              if(req.isAuthenticated())
                 { 
                     return next();
                 }
              res.redirect("/login");
         };



app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
});