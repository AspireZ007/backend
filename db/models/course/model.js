const mongoose = require("mongoose")

const COURSE_ACCESS_CODES = {
  LIMITED_ACCESS: 0,
  FULL_ACCESS: 1,
}

const duration = {
  hours: { type: Number, required: true, default: 0 },
  minutes: { type: Number, required: true, default: 0 },
  seconds: { type: Number, required: true, default: 0 },
}

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  instructorName: { type: String, required: true },
  duration: { type: duration, required: true },
  access: {
    type: Number,
    required: true,
    default: COURSE_ACCESS_CODES.LIMITED_ACCESS,
  },
  articlesCount: { type: Number, required: true, default: 0 },
  assignmentsCount: { type: Number, required: true, default: 0 },
  courseOverview: { type: String, required: true },
  courseContents: { type: [String], required: true, default: [] },
  price: { type: Number, required: true, default: 0 },
  rating: { type: Number, required: true, default: 0 },
  image: { type: String, required: true },
  capacity: { type: Number, required: true, default: 0 },
})

const Course = mongoose.model("connections", courseSchema)

module.exports = Course
