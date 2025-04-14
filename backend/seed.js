const mongoose = require("mongoose");
const Study = require("./models/study");
require("dotenv").config();

const seedStudies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "studyfront",
    });

    await Study.deleteMany({});

    const studies = [
      {
        title: "Study 1",
        description: "Description for study 1",
        questions: [],
      },
      {
        title: "Study 2",
        description: "Description for study 2",
        questions: [],
      },
      {
        title: "Study 3",
        description: "Description for study 3",
        question: [],
      },
    ];
    await Study.insertMany(studies);
    console.log("Database seeded successfully");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding the databse: ", error);
    await mongoose.disconnect();
  }
};
