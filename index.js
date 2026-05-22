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

const PORT =
  process.env.PORT || 5000;

// ================= MIDDLEWARE =================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://mediqueue-client-snowy.vercel.app"
    ],
    credentials: true,
  })
);

app.use(express.json());

// ================= MONGODB URI =================

const uri =
  process.env.MONGODB_URI;

// ================= MONGODB CLIENT =================

const client =
  new MongoClient(uri, {
    serverApi: {
      version:
        ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

// ================= MAIN FUNCTION =================

async function run() {

  try {

  await client.connect();

    console.log(
      "Successfully connected to MongoDB!"
    );

    // ================= DATABASE =================

    const tutorsCollection =
      client
        .db("mediqueue")
        .collection("tutors");

    const bookingsCollection =
      client
        .db("mediqueue")
        .collection("bookings");

    // ==================================================
    // ADD TUTOR API
    // ==================================================

    app.post(
      "/tutors",
      async (req, res) => {

        try {

          const tutorData = {

            ...req.body,

            hourlyFee:
              parseInt(
                req.body
                  .hourlyFee
              ),

            totalSlot:
              parseInt(
                req.body
                  .totalSlot
              ),

            createdAt:
              new Date(),
          };

          const result =
            await tutorsCollection.insertOne(
              tutorData
            );

          res.send({
            success: true,
            insertedId:
              result.insertedId,
            message:
              "Tutor added successfully",
          });

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to add tutor",
            });
        }
      }
    );

    // ==================================================
    // GET ALL TUTORS
    // ==================================================

    app.get(
      "/tutors",
      async (req, res) => {

        try {

          // ================= QUERY PARAMS =================

          const category =
            req.query.category;

          const search =
            req.query.search;

          const startDate =
            req.query.startDate;

          const endDate =
            req.query.endDate;

          // ================= DYNAMIC QUERY =================

          const query = {};

          // CATEGORY FILTER

          if (category) {

            query.subject = {
              $regex: category,
              $options: "i",
            };
          }

          // SEARCH FILTER

          if (search) {

            query.tutorName = {
              $regex: search,
              $options: "i",
            };
          }

          // DATE FILTER

          if (
            startDate &&
            endDate
          ) {

            query.createdAt = {
              $gte:
                new Date(
                  startDate
                ),

              $lte:
                new Date(
                  endDate
                ),
            };
          }

          // ================= FETCH DATA =================

          const result =
            await tutorsCollection
              .find(query)
              .sort({
                createdAt: -1,
              })
              .toArray();

          // ================= RESPONSE =================

          res.send(result);

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to fetch tutors",
            });
        }
      }
    );

    // ==================================================
    // GET SINGLE TUTOR
    // ==================================================

    app.get(
      "/tutors/:id",
      async (req, res) => {

        try {

          const id =
            req.params.id;

          let query;

          // CHECK OBJECT ID

          if (
            ObjectId.isValid(id)
          ) {

            query = {
              $or: [
                {
                  _id:
                    new ObjectId(
                      id
                    ),
                },
                {
                  _id: id,
                },
              ],
            };

          } else {

            query = {
              _id: id,
            };
          }

          const result =
            await tutorsCollection.findOne(
              query
            );

          if (!result) {

            return res
              .status(404)
              .send({
                success: false,
                message:
                  "Tutor not found",
              });
          }

          res.send(result);

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to fetch tutor",
            });
        }
      }
    );

    // ==================================================
// UPDATE TUTOR API
// ==================================================

app.patch(
  "/tutors/:id",
  async (req, res) => {

    try {

      const id =
        req.params.id;

      // CHECK VALID OBJECT ID

      if (
        !ObjectId.isValid(id)
      ) {

        return res
          .status(400)
          .send({
            success: false,
            message:
              "Invalid Tutor ID",
          });
      }

      // REQUEST BODY

      const updatedData =
        req.body;

      // FILTER

      const filter = {
        _id:
          new ObjectId(id),
      };

      // UPDATED DOCUMENT

      const updatedDoc = {
        $set: {

          tutorName:
            updatedData.tutorName,

          photo:
            updatedData.photo,

          subject:
            updatedData.subject,

          availableDays:
            updatedData.availableDays,

          availableTime:
            updatedData.availableTime,

          hourlyFee:
            parseInt(
              updatedData.hourlyFee
            ),

          totalSlot:
            parseInt(
              updatedData.totalSlot
            ),

          sessionStartDate:
            updatedData.sessionStartDate,

          institution:
            updatedData.institution,

          experience:
            updatedData.experience,

          location:
            updatedData.location,

          teachingMode:
            updatedData.teachingMode,
        },
      };

      // UPDATE DATABASE

      const result =
        await tutorsCollection.updateOne(
          filter,
          updatedDoc
        );

      // NOT FOUND

      if (
        result.matchedCount ===
        0
      ) {

        return res
          .status(404)
          .send({
            success: false,
            message:
              "Tutor not found",
          });
      }

      // SUCCESS RESPONSE

      res.send({
        success: true,
        message:
          "Tutor updated successfully",
        modifiedCount:
          result.modifiedCount,
      });

    } catch (error) {

      console.log(error);

      res
        .status(500)
        .send({
          success: false,
          message:
            "Failed to update tutor",
        });
    }
  }
);

    // ==================================================
    // DELETE TUTOR API
    // ==================================================

    app.delete(
      "/tutors/:id",
      async (req, res) => {

        try {

          const id =
            req.params.id;

          if (
            !ObjectId.isValid(id)
          ) {

            return res
              .status(400)
              .send({
                success:
                  false,
                message:
                  "Invalid Tutor ID",
              });
          }

          const query = {
            _id:
              new ObjectId(id),
          };

          const result =
            await tutorsCollection.deleteOne(
              query
            );

          if (
            result.deletedCount ===
            0
          ) {

            return res
              .status(404)
              .send({
                success:
                  false,
                message:
                  "Tutor not found",
              });
          }

          res.send({
            success: true,
            message:
              "Tutor deleted successfully",
            result,
          });

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to delete tutor",
            });
        }
      }
    );

    // ==================================================
    // GET MY TUTORS API
    // ==================================================

    app.get(
      "/my-tutors",
      async (req, res) => {

        try {

          const email =
            req.query.email;

          const query = {};

          if (email) {

            query.creatorEmail =
              email;
          }

          const result =
            await tutorsCollection
              .find(query)
              .sort({
                _id: -1,
              })
              .toArray();

          res.send(result);

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to fetch tutors",
            });
        }
      }
    );

    // ==================================================
    // CREATE BOOKING API
    // ==================================================

    app.post(
      "/bookings",
      async (req, res) => {

        try {

          const bookingData =
            req.body;

          const tutorId =
            bookingData.tutorId;

          if (
            !ObjectId.isValid(
              tutorId
            )
          ) {

            return res
              .status(400)
              .send({
                success:
                  false,
                message:
                  "Invalid Tutor ID",
              });
          }

          const tutor =
            await tutorsCollection.findOne(
              {
                _id:
                  new ObjectId(
                    tutorId
                  ),
              }
            );

          if (!tutor) {

            return res
              .status(404)
              .send({
                success:
                  false,
                message:
                  "Tutor not found",
              });
          }

          if (
            parseInt(
              tutor.totalSlot
            ) <= 0
          ) {

            return res.send({
              success:
                false,
              message:
                "No available slots",
            });
          }

          const alreadyBooked =
            await bookingsCollection.findOne(
              {
                tutorName:
                  bookingData.tutorName,

                studentEmail:
                  bookingData.studentEmail,

                bookingStatus:
                  "confirmed",
              }
            );

          if (
            alreadyBooked
          ) {

            return res.send({
              success:
                false,
              message:
                "You already booked this tutor",
            });
          }

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

          const bookingResult =
            await bookingsCollection.insertOne(
              newBooking
            );

          await tutorsCollection.updateOne(
            {
              _id:
                new ObjectId(
                  tutorId
                ),
            },
            {
              $inc: {
                totalSlot:
                  -1,
              },
            }
          );

          res.send({
            success: true,
            message:
              "Booking successful",
            bookingResult,
          });

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to create booking",
            });
        }
      }
    );

    // ==================================================
    // GET USER BOOKINGS API
    // ==================================================

    app.get(
      "/bookings",
      async (req, res) => {

        try {

          const email =
            req.query.email;

          const query = {};

          if (email) {

            query.studentEmail =
              email;
          }

          const result =
            await bookingsCollection
              .find(query)
              .sort({
                createdAt: -1,
              })
              .toArray();

          res.send(result);

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to fetch bookings",
            });
        }
      }
    );

    // ==================================================
    // CANCEL BOOKING API
    // ==================================================

    app.patch(
      "/bookings/:id",
      async (req, res) => {

        try {

          const id =
            req.params.id;

          if (
            !ObjectId.isValid(id)
          ) {

            return res
              .status(400)
              .send({
                success:
                  false,
                message:
                  "Invalid Booking ID",
              });
          }

          const booking =
            await bookingsCollection.findOne(
              {
                _id:
                  new ObjectId(
                    id
                  ),
              }
            );

          if (!booking) {

            return res
              .status(404)
              .send({
                success:
                  false,
                message:
                  "Booking not found",
              });
          }

          const result =
            await bookingsCollection.updateOne(
              {
                _id:
                  new ObjectId(
                    id
                  ),
              },
              {
                $set: {
                  bookingStatus:
                    "cancelled",
                },
              }
            );

          if (
            booking.tutorId &&
            ObjectId.isValid(
              booking.tutorId
            )
          ) {

            await tutorsCollection.updateOne(
              {
                _id:
                  new ObjectId(
                    booking.tutorId
                  ),
              },
              {
                $inc: {
                  totalSlot:
                    1,
                },
              }
            );
          }

          res.send({
            success: true,
            message:
              "Booking cancelled successfully",
            result,
          });

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to cancel booking",
            });
        }
      }
    );

    // ==================================================
    // FEATURED TUTORS API
    // ==================================================

    app.get(
      "/featured-tutors",
      async (req, res) => {

        try {

          const result =
            await tutorsCollection
              .find()
              .limit(6)
              .toArray();

          res.send(result);

        } catch (error) {

          console.log(error);

          res
            .status(500)
            .send({
              success: false,
              message:
                "Failed to fetch featured tutors",
            });
        }
      }
    );

    // ==================================================
    // ROOT ROUTE
    // ==================================================

    app.get("/", (req, res) => {

      res.send(
        "Mediqueue Server Running"
      );
    });

    console.log(
      "MongoDB Connected Successfully"
    );

  } finally {
  }
}

run().catch(console.dir);

// ================= SERVER =================

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});

module.exports = app;