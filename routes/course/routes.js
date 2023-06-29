// External Import
const express = require('express')

// Helpers
const { checkJwt } = require('../../helpers/jwt')
const { generateResponseMessage } = require('../../helpers/response')
const checkUserRole = require('../../helpers/db').checkUserRole

const Course = require('../../db/models/course/model')
const CourseValidator = require('./validator')
const router = express.Router()

router.use(checkJwt)

// Create a new course
router.post('/add', async (req, res) => {
    const{courseName,
          instructorName,
          duration,
          access, 
          articlesCount, 
          assignmentsCount, 
          courseOverview, 
          courseContents, 
          price, 
          rating, 
          image, 
          capacity} = req.body
    if(!courseName || !instructorName || !duration || !access || !articlesCount || !assignmentsCount || !courseOverview || !courseContents || !price || !rating || !image || !capacity){
        return res.status(400).json(generateResponseMessage("error","Please fill all the fields"))
    }
    const {error} = CourseValidator(req.body)

    if(error){
        return res.status(400).json(generateResponseMessage("error",error.details[0].message))
    }

    const courseObject = { courseName, instructorName, duration, access, articlesCount, assignmentsCount, courseOverview, courseContents, price, rating, image, capacity}

    const course = new Course(courseObject)

    try{
        const userId = req.userId
        const role = await checkUserRole(userId) 

        if(role !== 1){
            return res.status(403).json(generateResponseMessage("error","You are not authorized to add a course"))
        }
        
        await course.save()
        return res.status(200).json(generateResponseMessage("success","Course added successfully"))
    }catch(err){
        return res.status(400).json(generateResponseMessage("error",err.message))
    }

})

router.get('/all', async (req, res) =>{
    const userId = req.userId // from the middleware checkJWT
    const userExists = await isUserActive(userId)
    // only permanent users can access the courses
    if (userExists !== 1){
        const outputString =  "The user's account is " +
            (userExists == -1) ? "throwing a db error" :
            (userExists == -2) ? "not a valid id" :
            (userExists == 0) ? "not found with this id" :
            (userExists == 2) ? "is only temporarily registered" :
            (userExists == 3) ? "is banned" : `!! returning ${userExists}`
        return res.status(403).json(generateResponseMessage("error", outputString))
    }
    try{
        const courses = await Course.find().projection({
            courseName:1,
            instructorName:1,
            duration:1,
            price:1,
            rating:1,
            image:1,
         })
         res.status(200).json(courses)
    }
    catch(err){
        res.status(500).json({msg: err.message})
    }
})

router.get("/trending", async (req, res) => {
    //not required to be logged in
    // const userId = req.userId // from the middleware checkJWT
    try{
        const trendingCourses = await Course.find().projection({
            courseName:1,
            instructorName:1,
            duration:1,
            price:1,
            rating:1,
            image:1,
        }).sort({rating: -1}).limit(6)
        res.status(200).json(trendingCourses)
    }
    catch(err){
        res.status(500).json({msg: err.message})
    }

})

router.get('/details:id', async(req, res) => {
    const userId = req.userId // from the middleware checkJWT
    const userExists = await isUserActive(userId)
    // only permanent users can access the courses
    if (userExists !== 1){
        const outputString =  "The user's account is " +
            (userExists == -1) ? "throwing a db error" :
            (userExists == -2) ? "not a valid id" :
            (userExists == 0) ? "not found with this id" :
            (userExists == 2) ? "is only temporarily registered" :
            (userExists == 3) ? "is banned" : `!! returning ${userExists}`
        return res.status(403).json(generateResponseMessage("error", outputString))
    }
    try{
        const course = await Course.findById(req.params.id)
        if(!course) throw Error('Course not found')
        res.status(200).json(course)
    }
    catch(err){
        res.status(500).json({msg: err.message})
    }
})