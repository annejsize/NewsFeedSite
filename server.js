var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

//The scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/jezebel", {
  useMongoClient: true
});

// Routes

// A GET route for scraping
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.jezebel.com/").then(function(response) {

    var $ = cheerio.load(response.data);

    $("header h1").each(function(i, element) {

        var result = {};

        result.title = $(this).children("a").text();
        result.link = $(this).children("a").attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result).then(function(dbArticle) {res.send("Scrape Complete");})
        .catch(function(err) {
          res.json(err);
        });
    });
  });
});

//the route for ALL articles
app.get("/articles", function(req, res) {
  db.Article
    .find({}).then(function(dbArticle) {res.json(dbArticle);})
    .catch(function(err) {
      res.json(err);
    });
});

// the route for pulling a specific article
app.get("/articles/:id", function(req, res) {
  db.Article
    .findOne({ _id: req.params.id }).populate("note").then(function(dbArticle) {
      res.json(dbArticle);})
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Pull article summary
app.get('/readArticle/:id', function(req, res){
  var articleId = req.params.id;
  var hbsObj = {
    article: [],
    body: []
  };
      // //find the article at the id
      Article.findOne({ _id: articleId })
      .populate('comment')
      .exec(function(err, doc){
      if(err){
        console.log('Error: ' + err);
      } else {
        hbsObj.article = doc;
        var link = doc.link;
        //grab article from link
        request(link, function(error, response, html) {
          var $ = cheerio.load(html);
          console.log($);

        });
      }

    });
});



// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
