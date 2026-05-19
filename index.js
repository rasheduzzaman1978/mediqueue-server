const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const {
  MongoClient,
  ServerApiVersion,
} = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5000;


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());


// ================= MONGODB URI =================

const uri = process.env.MONGODB_URI;


// ================= MONGODB CLIENT =================

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// ================= MAIN FUNCTION =================

async function run() {
  try {

    // MongoDB Connect
    await client.connect();

    console.log(
      "Successfully connected to MongoDB!"
    );


    // ================= DATABASE =================

    const tutorsCollection = client
      .db("medequeue")
      .collection("tutors");

    const bookingsCollection = client
      .db("medequeue")
      .collection("bookings");


    // ==================================================
    // ADD TUTOR API
    // ==================================================

    app.post("/tutors", async (req, res) => {

      const tutorData = req.body;

      const result =
        await tutorsCollection.insertOne(
          tutorData
        );

      res.send(result);
    });


    // ==================================================
    // GET ALL TUTORS
    // ==================================================

    app.get("/tutors", async (req, res) => {

      const result =
        await tutorsCollection
          .find()
          .toArray();

      res.send(result);
    });


    // ==================================================
    // GET 6 FEATURED TUTORS
    // ==================================================

    app.get(
      "/featured-tutors",
      async (req, res) => {

        const result =
          await tutorsCollection
            .find()
            .limit(6)
            .toArray();

        res.send(result);
      }
    );


    // ==================================================
    // MONGODB PING
    // ==================================================

    await client
      .db("admin")
      .command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

  } finally {

  }
}

run().catch(console.dir);


// ================= ROOT ROUTE =================

app.get("/", (req, res) => {
  res.send("TutorQueue Server Running");
});


// ================= SERVER =================

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});