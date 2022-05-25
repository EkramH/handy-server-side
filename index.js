const express = require("express");
const cors = require("cors");
require("dotenv").config();
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

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("handy_data").collection("products");
    const purchasedCollection = client.db("handy_data").collection("purchased");

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
    app.get("/purchased", async (req, res) =>{
      const userEmail = req.query.userEmail;
      const query = {userEmail : userEmail};
      const orders = await purchasedCollection.find(query).toArray();
      res.send(orders.reverse());  
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
