// index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
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
      .db("mediqueue")
      .collection("tutors");

    const bookingsCollection = client
      .db("mediqueue")
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
    // GET SINGLE TUTOR
    // ==================================================

    app.get("/tutors/:id", async (req, res) => {
  try {

    const id = req.params.id;

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid tutor ID",
      });
    }

    const query = {
      _id: new ObjectId(id),
    };

    const result =
      await tutorsCollection.findOne(
        query
      );

    if (!result) {
      return res.status(404).send({
        message: "Tutor not found",
      });
    }

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message:
        "Failed to fetch tutor",
    });
  }
});

// ==================================================
// UPDATE TUTOR API
// ==================================================

app.patch("/tutors/:id", async (req, res) => {

  try {

    const id = req.params.id;

    const updatedTutor = req.body;

    // Validate MongoDB ID
    if (!ObjectId.isValid(id)) {

      return res.status(400).send({
        message: "Invalid Tutor ID",
      });
    }

    const filter = {
      _id: new ObjectId(id),
    };

    const updatedDoc = {
      $set: {

        tutorName:
          updatedTutor.tutorName,

        photo:
          updatedTutor.photo,

        subject:
          updatedTutor.subject,

        availableDays:
          updatedTutor.availableDays,

        availableTime:
          updatedTutor.availableTime,

        hourlyFee:
          parseInt(
            updatedTutor.hourlyFee
          ),

        totalSlot:
          parseInt(
            updatedTutor.totalSlot
          ),

        sessionStartDate:
          updatedTutor.sessionStartDate,

        institution:
          updatedTutor.institution,

        experience:
          updatedTutor.experience,

        location:
          updatedTutor.location,

        teachingMode:
          updatedTutor.teachingMode,
      },
    };

    const result =
      await tutorsCollection.updateOne(
        filter,
        updatedDoc
      );

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message:
        "Failed to update tutor",
    });
  }
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