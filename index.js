const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ijdbv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: "UnAuthorized access"})
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(403).send({message: "Forbidden access"})
    }
    req.decoded = decoded;
    next()
  });

}

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("handy_data").collection("products");
    const purchasedCollection = client.db("handy_data").collection("purchased");
    const userCollection = client.db("handy_data").collection("users");

    // Get all products
    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // Get one product
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    // Put user
    app.put("/user/:email", async (req, res) =>{
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email};
      const options = { upsert : true };
      const updatedDoc = {
        $set: user, 
      };
      const result = await userCollection.updateOne(filter, updatedDoc, options);
      const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.send({result, token});
    })

    //Update product price
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updatedQuantity = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updatedQuantity.newQuantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    //Get one purchased 
    app.get("/purchased", verifyJWT, async (req, res) =>{
      const userEmail = req.query.userEmail;
      const decodedEmail = req.decoded.email;
      if(userEmail === decodedEmail){
        const query = {userEmail : userEmail};
        const orders = await purchasedCollection.find(query).toArray();
        return res.send(orders.reverse()); 
      }else{
        return res.status(403).send({message: "Forbidden access"})
      }
    })

    //Purchased post api
    app.post("/purchased", async (req, res) =>{
      const purchased = req.body;
      const result = await purchasedCollection.insertOne(purchased);
      res.send(result);
    })
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Handy Portal Sever On!!!!");
});

app.listen(port, () => {
  console.log(`Handy app listening on port ${port}`);
});
