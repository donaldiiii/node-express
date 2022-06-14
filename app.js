const express = require("express");
const bodyParser  = require('body-parser');

const app = express();

app.use( bodyParser.urlencoded({extended:false}));
app.post('/',(req, res, next) => {
     res.send('<h1> user : ' + req.body.username + '</h1>')
})
//handle requests by using middlewares.
//every incoming request funneled by middlewares
// Start of MiddleWare funnel`
app.get('/',(req, res, next) => {
 
  res.send(
    '<form method="POST"><input type="text" name="username"><button type="submit">Create User</button></form>'
  );
});
// End of MiddleWare funnel
app.listen(5000);

