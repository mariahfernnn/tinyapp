const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function lookUpEmail(email) {
  // Create an email lookup helper function
  // Assisted by Ahmed Dauda (mentor)
  let keys = Object.keys(users);

  for (let key of keys) {
    if (users[key].email === email) {
      console.log("Email already exists!");
      return users[key];
    } 
  }
 return false;
}

app.set("view engine", "ejs");

function generateRandomString(length) { 
  // solution found https://itsolutionstuff.com/post/how-to-generate-random-string-in-javascriptexample.html 
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let string = possible.length;

  for (let x = 0; x < length; x++) {
    text += possible.charAt(Math.floor(Math.random() * string));
  }
  return text;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = users[userID];
  let templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = users[userID];
  let templateVars = {
    user: user,
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = users[userID];
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: user
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => { 
  // Generate a random shortURL for a longURL
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
  console.log(urlDatabase); // Log the POST request body to the console
});

app.get("/u/:shortURL", (req, res) => { 
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/urls/:shortURL/edit", (req, res) => {  
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  let userID = req.cookies["user_id"];
  let user = users[userID];
  res.render("urls_show", {shortURL, longURL, user} );
});

app.post("/urls/:shortURL", (req, res) => { 
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls/" + req.params.shortURL);
});

app.get("/register", (req, res) => {  
  // Create a GET /register endpoint, which returns the register template you created
  let userID = req.cookies["user_id"];
  let user = users[userID];
  let templateVars = {
    urls: [],
    user: user
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {  
  // Create a POST /register endpoint - add a new user object to the global users obj

  let existingUser = lookUpEmail(req.body.email);
  
  if (existingUser || req.body.email === "" || req.body.password === "") {
    // Assisted by Ahmed Dauda (mentor)
    res.status(400).send("Email already exists!");
    } else {
      let userRandomID = generateRandomString(6);
      users[userRandomID] = {
        "id": userRandomID,
        "email": req.body.email,
        "password": req.body.password
      };
      res.cookie("user_id", userRandomID);
      res.redirect("/urls");
    }
});

app.get("/login", (req, res) => {  
  // Create a GET /login endpoint, which returns the login template you created
  // Assisted by Spiro Sideris (mentor)
  let userID = req.cookies["user_id"];
  let user = users[userID]; // Lookup the user obj in the users obj using the user_id value

  let templateVars = {
    urls: [],
    user: user,
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  let existingUser = lookUpEmail(req.body.email);

  if (existingUser) {
    if (existingUser.password === req.body.password) {
      res.cookie("user_id", existingUser.id).redirect("/urls");
    } else {
      res.status(403).send("Passwords do not match!");
    }
  } else {
    res.status(403).send("Email cannot be found!");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id").redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});