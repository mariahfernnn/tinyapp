const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { getUserByEmail } = require("./helpers");

app.use(cookieSession( {
  name: 'session',
  keys: ["key"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

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

app.set("view engine", "ejs");

function generateRandomString(length) { 
  // solution found: https://itsolutionstuff.com/post/how-to-generate-random-string-in-javascriptexample.html 
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let string = possible.length;

  for (let x = 0; x < length; x++) {
    text += possible.charAt(Math.floor(Math.random() * string));
  }
  return text;
}

// Update url database - change the value to an obj that has longURL and userID keys itself
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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

// Modify so only registered and logged in users can create new tiny URLs
app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  let user = users[userID];
  let templateVars = {
    user: user
  };
  
  if (user) {
  res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// Filter the urlDatabase to compare the userID with the logged-in user's ID
// Assisted by Andrew Matte(mentor) - added the shortURL into the data obj
function urlsForUser(id) {
  let myURL = [];
  for (let key in urlDatabase) {
    let userID = urlDatabase[key].userID;
    if(id === userID) {
      data = urlDatabase[key];
      data.shortURL = key;
      myURL.push(data);

    }
  }
  return myURL;
}

// My URLs
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  if(!userID) {
  res.status(401).send("Login first!");
  return;
  } 
  let myURL = urlsForUser(userID);
  let user = users[userID];
  let templateVars = {
    urls: myURL,
    user: user
  }
   res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  
  res.render("urls_show", templateVars);
});

// Create new URL: Generate a random shortURL for a longURL
// Assisted by Spiro Sideris (mentor) - assigning the longURL value to an obj
app.post("/urls", (req, res) => { 
  let shortURL = generateRandomString(6);
  let obj = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  urlDatabase[shortURL] = obj;
  res.redirect(`/urls/${shortURL}`);
  console.log(obj);
});

app.get("/u/:shortURL", (req, res) => { 
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Assisted by Ben Hare(mentor)
app.post("/urls/:shortURL/delete", (req, res) => {
  let urlObj = urlDatabase[req.params.shortURL];
  if (urlObj.userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

app.get("/urls/:shortURL/edit", (req, res) => {  
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  urlDatabase[shortURL] = longURL;
  let userID = req.session.user_id;
  let user = users[userID];
  
  res.render("urls_show", {shortURL, longURL, user} );
});

app.post("/urls/:shortURL", (req, res) => { 
  let urlObj = urlDatabase[req.params.shortURL];
  if (urlObj.userID === req.session.user_id) {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  }
  res.redirect("/urls/" + req.params.shortURL);
});

// Create a GET /register endpoint, which returns the register template you created
app.get("/register", (req, res) => {  
  let userID = req.session.user_id;
  let user = users[userID];
  let templateVars = {
    urls: [],
    user: user
  };
  res.render("urls_register", templateVars);
});

// Create a POST /register endpoint - add a new user object to the global users obj
app.post("/register", (req, res) => {  
  
  let existingUser = getUserByEmail(req.body.email, users);
  
  // Assisted by Ahmed Dauda (mentor)
  if (existingUser || req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email already exists!");
    } else {
      let userRandomID = generateRandomString(6);
      users[userRandomID] = {
        "id": userRandomID,
        "email": req.body.email,
        "password": bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = userRandomID;
      res.redirect("/urls");
    }
});

// Create a GET /login endpoint, which returns the login template you created
// Assisted by Spiro Sideris (mentor)
app.get("/login", (req, res) => {  
  let userID = req.session.user_id;
  let user = users[userID]; // Lookup the user obj in the users obj using the user_id value

  let templateVars = {
    urls: [],
    user: user,
  };
  res.render("urls_login", templateVars);
});

// Assisted by Will Hawkins(mentor) - adding parameter to set cookie
app.post("/login", (req, res) => {
  let existingUser = getUserByEmail(req.body.email, users);
  console.log(existingUser.password);

  if (existingUser) {
    if (bcrypt.compareSync(req.body.password, existingUser.password)) {
      req.session.user_id = existingUser.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("Passwords do not match!");
    }
  } else {
    res.status(403).send("Email cannot be found!");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});