import express from "express"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware"
import { UserRole } from "../globals/types"
import errorHandler from "../utils/errorHandler"
import ShotReviewControllers from "../controller/shotReviewController"
const router = express.Router()

router.post(":submissionId/approve",
    isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager),
    errorHandler(ShotReviewControllers.approveSubmission)
)

router.post(":submissionId/redo",
    isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager),
    errorHandler(ShotReviewControllers.requestRedo)
)


export default router

// import express from "express"

// import authMiddleware
//     from "../middlewares/authMiddleware"

// import accessTo
//     from "../middlewares/roleMiddleware"

// import { UserRole } from "../globals/types"
// import shotReviewController from "../controllers/shotReviewController"


// const router = express.Router()


// // ==========================================
// // CREATE REVIEW
// // ==========================================

// router.post(

//     "/submissions/:submissionId/reviews",

//     authMiddleware,

//     accessTo(
//         UserRole.ProjectManager,
//         UserRole.Admin
//     ),

//     (req, res) => shotReviewController.createReview(req as any, res)

// )


// // ==========================================
// // GET REVIEW BY SUBMISSION ID
// // ==========================================

// router.get(

//     "/submissions/:submissionId/review",

//     authMiddleware,

//     shotReviewController.getReviewBySubmission

// )


// // ==========================================
// // GET ALL REVIEWS BY USER
// // ==========================================

// router.get(

//     "/reviewers/:reviewerId/reviews",

//     authMiddleware,

//     shotReviewController.getUserReviews

// )


// // ==========================================
// // UPDATE REVIEW
// // ==========================================

// router.patch(

//     "/reviews/:reviewId",

//     authMiddleware,

//     accessTo(
//         UserRole.ProjectManager,
//         UserRole.Admin
//     ),

//     shotReviewController.updateReview

// )


// // ==========================================
// // DELETE REVIEW
// // ==========================================

// router.delete(

//     "/reviews/:reviewId",

//     authMiddleware,

//     accessTo(
//         UserRole.ProjectManager,
//         UserRole.Admin
//     ),

//     shotReviewController.deleteReview

// )


// export default router
