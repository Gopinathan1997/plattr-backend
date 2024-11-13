const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const { BSON } = require("mongodb"); // Import BSON module
const { ObjectId } = BSON;
const {v4 : uuid} = require('uuid')
require("dotenv").config();

const uri = process.env.ATLASURL;
const app = express();
const PORT = 3001;

// Middleware to handle JSON and CORS
app.use(express.json());
app.use(cors("*"));

// Create a MongoClient with Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// MongoDB database and collection
const dbName = "expenseTracker";
const collectionName = "expenses";

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // Ping the database to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully pinged MongoDB!");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

run();

// POST route to add expense data
app.post("/addexpense", async (req, res) => {
  const formData = req.body;

  if (!formData.amount || !formData.category) {
    return res
      .status(400)
      .json({ message: "Amount and category are required." });
  }

  try {
    // Access the database and collection
    const db = client.db(dbName);
    const newId = uuid()
    const expensesCollection = db.collection(collectionName);
    formData.id = newId
    // Insert the form data into the collection
    const result = await expensesCollection.insertOne(formData);
    console.log("Data inserted:", result.insertedId);

    res.status(201).json({
      message: "Expense added successfully",
      data: formData,
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ message: "Failed to add expense" });
  }
});
// GET route to fetch all data from the 'expenses' collection
app.get("/getdata", async (req, res) => {
  try {
    // Access the 'expenseTracker' database and the 'expenses' collection
    const db = client.db("expenseTracker");
    const expensesCollection = db.collection("expenses");

    // Fetch all documents from the 'expenses' collection
    const allExpenses = await expensesCollection.find({}).toArray();

    // Respond with the fetched data
    res.status(200).json({
      message: "All expenses fetched successfully",
      data: allExpenses,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});
app.delete("/delete", async (req, res) => {
  const id = req.body;
  console.log(id.title);
  const db = client.db("expenseTracker");
  const expensesCollection = db.collection("expenses");

  try {
    const data = await expensesCollection.findOneAndDelete({ title: id.title });
    if (data) {
      res.status(200).json({ message: "Expense Successfully Deleted" });
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
});
app.put("/update", async (req, res) => {
  const id = req.body;
  const formData = id.formData
  console.log(typeof(formData));
  const db = client.db("expenseTracker");
  const expensesCollection = db.collection("expenses");

  try {
    const del = await expensesCollection.findOneAndDelete({ title: formData.title });
    const data = await expensesCollection.findOneAndReplace({
      title: id.title,
      formData,
    });
    if (data) {
      res.status(200).json({ message: "Expense Successfully Deleted" });
    }
  } catch (error) {
    console.error("Error update expense:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
});
