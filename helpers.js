const testUsers = {
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

const getUserByEmail = function(email, users) {

  let keys = Object.keys(users);
  for (let key of keys) {
    if (users[key].email === email) {
      return users[key];
    } 
  }

}

// console.log(getUserByEmail("bee@example.com"), testUsers)

module.exports = { getUserByEmail };

