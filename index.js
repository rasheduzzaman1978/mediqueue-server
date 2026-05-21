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

app.use(
  cors({
    origin:
      "http://localhost:3000",

    credentials: true,
  })
);

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

  try {

    const tutorData = {

      ...req.body,

      hourlyFee: parseInt(
        req.body.hourlyFee
      ),

      totalSlot: parseInt(
        req.body.totalSlot
      ),
    };

    const result =
      await tutorsCollection.insertOne(
        tutorData
      );

    res.send({
      success: true,
      result,
    });

  } catch (error) {

    console.log(error);

    res.status(500).send({
      success: false,
      message:
        "Failed to add tutor",
    });
  }
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
// DELETE TUTOR API
// ==================================================

app.delete("/tutors/:id", async (req, res) => {

  try {

    const id = req.params.id;

    // Validate MongoDB ID
    if (!ObjectId.isValid(id)) {

      return res.status(400).send({
        message: "Invalid Tutor ID",
      });
    }

    const query = {
      _id: new ObjectId(id),
    };

    const result =
      await tutorsCollection.deleteOne(query);

    // যদি কোনো tutor না পাওয়া যায়
    if (result.deletedCount === 0) {

      return res.status(404).send({
        message: "Tutor not found",
      });
    }

    res.send({
      success: true,
      message: "Tutor deleted successfully",
      result,
    });

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message: "Failed to delete tutor",
    });
  }
});

// ==================================================
// CREATE BOOKING API
// ==================================================

app.post("/bookings", async (req, res) => {

  try {

    const bookingData = req.body;

    const tutorId = bookingData.tutorId;

    // ==========================================
    // VALIDATE TUTOR ID
    // ==========================================

    if (!ObjectId.isValid(tutorId)) {

      return res.status(400).send({
        success: false,
        message: "Invalid Tutor ID",
      });
    }

    // ==========================================
    // FIND TUTOR
    // ==========================================

    const tutor =
      await tutorsCollection.findOne({
        _id: new ObjectId(tutorId),
      });

    // Tutor not found
    if (!tutor) {

      return res.status(404).send({
        success: false,
        message: "Tutor not found",
      });
    }

    // ==========================================
    // SLOT CHECK
    // ==========================================

   if (
  parseInt(
    tutor.totalSlot
  ) <= 0
) {

      return res.send({
        success: false,
        message:
          "This session is fully booked. You can’t join at the moment.",
      });
    }

    // ==========================================
    // SESSION DATE CHECK
    // ==========================================

    const today = new Date();

today.setHours(0, 0, 0, 0);

const sessionDate = new Date(
  tutor.sessionStartDate
);

sessionDate.setHours(
  0,
  0,
  0,
  0
);

    // আজকের date যদি session date এর আগে হয়
    if (today < sessionDate) {

      return res.send({
        success: false,
        message:
          "Booking is not available yet for this tutor",
      });
    }

    // ==========================================
    // CHECK DUPLICATE BOOKING
    // ==========================================

    const alreadyBooked =
  await bookingsCollection.findOne({

    tutorName:
      bookingData.tutorName,

    studentEmail:
      bookingData.studentEmail,

    bookingStatus:
      "confirmed",
  });

    if (alreadyBooked) {

      return res.send({
        success: false,
        message:
          "You already booked this tutor",
      });
    }

    // ==========================================
    // CREATE BOOKING OBJECT
    // ==========================================

    const newBooking = {

      studentName:
        bookingData.studentName,

      phone:
        bookingData.phone,

      tutorId:
        bookingData.tutorId,

      tutorName:
        bookingData.tutorName,

      studentEmail:
        bookingData.studentEmail,

      bookingStatus:
        "confirmed",

      createdAt:
        new Date(),
    };

    // ==========================================
    // SAVE BOOKING
    // ==========================================

    const bookingResult =
      await bookingsCollection.insertOne(
        newBooking
      );

    // ==========================================
    // AUTO DECREASE SLOT
    // ==========================================

    await tutorsCollection.updateOne(
      {
        _id: new ObjectId(tutorId),
      },
      {
        $inc: {
          totalSlot: -1,
        },
      }
    );

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    res.send({
      success: true,
      message:
        "Booking successful",
      bookingResult,
    });

  } catch (error) {

    console.log(error);

    res.status(500).send({
      success: false,
      message:
        "Failed to create booking",
    });
  }
});

// ==================================================
// GET MY TUTORS API
// ==================================================

app.get("/my-tutors", async (req, res) => {

  try {

    const email = req.query.email;

    const query = {};

    if (email) {

      query.creatorEmail =
        email;
    }

    const result =
      await tutorsCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message:
        "Failed to fetch tutors",
    });
  }
});

// ==================================================
// GET USER BOOKINGS API
// ==================================================

app.get("/bookings", async (req, res) => {

  try {

    const email = req.query.email;

    const query = {};

    if (email) {

      query.studentEmail =
        email;
    }

    const result =
      await bookingsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message:
        "Failed to fetch bookings",
    });
  }
});

// ==================================================
// CANCEL BOOKING API
// ==================================================

app.patch("/bookings/:id", async (req, res) => {

  try {

    const id = req.params.id;

    // ================= VALIDATE ID =================

    if (!ObjectId.isValid(id)) {

      return res.status(400).send({
        success: false,
        message:
          "Invalid Booking ID",
      });
    }

    // ================= FIND BOOKING =================

    const booking =
      await bookingsCollection.findOne({
        _id: new ObjectId(id),
      });

    // Booking not found
    if (!booking) {

      return res.status(404).send({
        success: false,
        message:
          "Booking not found",
      });
    }

    // Already cancelled
    if (
      booking.bookingStatus ===
      "cancelled"
    ) {

      return res.send({
        success: false,
        message:
          "Booking already cancelled",
      });
    }

    // ================= UPDATE BOOKING STATUS =================

    const result =
      await bookingsCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            bookingStatus:
              "cancelled",
          },
        }
      );

    // ================= RETURN SLOT =================

// Only if tutorId exists and valid
if (
  booking.tutorId &&
  ObjectId.isValid(
    booking.tutorId
  )
) {

  await tutorsCollection.updateOne(
    {
      _id: new ObjectId(
        booking.tutorId
      ),
    },
    {
      $inc: {
        totalSlot: 1,
      },
    }
  );
}

    // ================= SUCCESS RESPONSE =================

    res.send({
      success: true,
      message:
        "Booking cancelled successfully",
      result,
    });

  } catch (error) {

    console.log(error);

    res.status(500).send({
      success: false,
      message:
        "Failed to cancel booking",
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