// External Import
const express = require('express')

// Database
const { Course, FEEDBACKTYPE_CODES, REGISTRATIONSTATUS_CODES, MANAGERROLE_CODES } = require('../../db/models/course/model')

// Validators
const { createCourseValidator } = require('./validators')

// Helpers
// const checkUserRole = require('../../helpers/db').checkUserRole
const { checkJwt } = require('../../helpers/jwt')
const { generateResponseMessage } = require('../../helpers/response')

// Logger
const logger = require("../../helpers/logger")
const { USERROLE_CODES } = require('../../db/models/user/model')


// Instantiating the router object
const router = express.Router()

// Middleware to check for valid JWT token in header (authorization)
router.use(checkJwt)

/** Route to create a new course, allowed only by the SUPERADMINS.
 * @swagger
 * /course:
 *   post:
 *     summary: Allow a SUPERADMIN to create a course. 
 *     tags:
 *       - course
 *     description: Protected route for SUPERADMIN user. Creates a new Course available for public viewing. 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 required: true
 *                 example: Aspire JavaScript Course - Beginner
 *               description:
 *                 type: string
 *                 required: true
 *                 example: A beginner level introduction to JavaScript from Aspire.
 *               subtitle:
 *                 type: string
 *                 required: true
 *                 example: Learn Practical JS, Quick and Easy!
 *               tags:
 *                 schema: 
 *                   type: array
 *                   items:
 *                     type: string
 *                 required: true
 *                 example: ["JavaScript", "Beginner", "Slow Paced"]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followers queries and returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: success or error
 *                   example: success
 *                 data:
 *                   type: string
 *                   description: confirmation message in case of "status" success
 *                   example: { status: "success" }
 *                   required: false
 *       500:
 *         description: Server error in contacting database
 *       204:
 *         description: Same as 200 but no data returned
 */
router.post('/', async (req, res) => {
	const { userId, role } = req

	// check if role is valid
	if (role != USERROLE_CODES.SUPERADMIN) {
		res.status(403).json(generateResponseMessage("error", "not allowed for this role."))
	}

	// validate the params
	createCourseValidator.validate(req.params)

	const { title, subtitle, description, tags } = req.body

	let another = [1, 3]
	console.log(typeof title, typeof subtitle, typeof description, typeof tags, typeof another)

	try {
		// Create a new Course with the data
		const newCourseObject = { title, subtitle, description, tags, createdBy: userId, managers: [ { managerId: userId, role: MANAGERROLE_CODES.COORDINATOR } ] }
		const newCourse = new Course(newCourseObject)
		newCourse.save()
		res.status(200).json(generateResponseMessage("success", newCourse))
	} catch (err) {
		logger.error(err)
		res.status(500).json(generateResponseMessage("error", err))
	}
})


// // Create a new course
// router.post('/add', async (req, res) => {
//     const{courseName,
//           instructorName,
//           duration,
//           access, 
//           articlesCount, 
//           assignmentsCount, 
//           courseOverview, 
//           courseContents, 
//           price, 
//           rating, 
//           image, 
//           capacity} = req.body
//     if(!courseName || !instructorName || !duration || !access || !articlesCount || !assignmentsCount || !courseOverview || !courseContents || !price || !rating || !image || !capacity){
//         res.status(400).json(generateResponseMessage("error","Please fill all the fields"))
//     }
//     const {error} = CourseValidator(req.body)

//     if(error){
//         res.status(400).json(generateResponseMessage("error",error.details[0].message))
//     }

//     const courseObject = { courseName, instructorName, duration, access, articlesCount, assignmentsCount, courseOverview, courseContents, price, rating, image, capacity}

//     const course = new Course(courseObject)

//     try{
//         const userId = req.userId
//         const role = await checkUserRole(userId) 

//         if(role !== 1){
//             res.status(403).json(generateResponseMessage("error","You are not authorized to add a course"))
//         }
        
//         await course.save()
//         res.status(200).json(generateResponseMessage("success","Course added successfully"))
//     }catch(err){
//         res.status(400).json(generateResponseMessage("error",err.message))
//     }

// })

// router.get('/all', async (req, res) =>{
//     const userId = req.userId // from the middleware checkJWT
//     const userExists = await isUserActive(userId)
//     // only permanent users can access the courses
//     if (userExists !== 1){
//         const outputString =  "The user's account is " +
//             (userExists == -1) ? "throwing a db error" :
//             (userExists == -2) ? "not a valid id" :
//             (userExists == 0) ? "not found with this id" :
//             (userExists == 2) ? "is only temporarily registered" :
//             (userExists == 3) ? "is banned" : `!! returning ${userExists}`
//         res.status(403).json(generateResponseMessage("error", outputString))
//     }
//     try{
//         const courses = await Course.find().projection({
//             courseName:1,
//             instructorName:1,
//             duration:1,
//             price:1,
//             rating:1,
//             image:1,
//          })
//          res.status(200).json(courses)
//     }
//     catch(err){
//         res.status(500).json({msg: err.message})
//     }
// })

// router.get("/trending", async (req, res) => {
//     //not required to be logged in
//     // const userId = req.userId // from the middleware checkJWT
//     try{
//         const trendingCourses = await Course.find().projection({
//             courseName:1,
//             instructorName:1,
//             duration:1,
//             price:1,
//             rating:1,
//             image:1,
//         }).sort({rating: -1}).limit(6)
//         res.status(200).json(trendingCourses)
//     }
//     catch(err){
//         res.status(500).json({msg: err.message})
//     }

// })

// router.get('/details:id', async(req, res) => {
//     const userId = req.userId // from the middleware checkJWT
//     const userExists = await isUserActive(userId)
//     // only permanent users can access the courses
//     if (userExists !== 1){
//         const outputString =  "The user's account is " +
//             (userExists == -1) ? "throwing a db error" :
//             (userExists == -2) ? "not a valid id" :
//             (userExists == 0) ? "not found with this id" :
//             (userExists == 2) ? "is only temporarily registered" :
//             (userExists == 3) ? "is banned" : `!! returning ${userExists}`
//         res.status(403).json(generateResponseMessage("error", outputString))
//     }
//     try{
//         const course = await Course.findById(req.params.id)
//         if(!course) throw Error('Course not found')
//         res.status(200).json(course)
//     }
//     catch(err){
//         res.status(500).json({msg: err.message})
//     }
// })

module.exports = router