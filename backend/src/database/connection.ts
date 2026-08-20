import { Sequelize } from "sequelize-typescript";

import { envConfig } from "../config/config";

import User from "./models/userModel";
import Employee from "./models/employeeModel";

import Project from "./models/projectModel";
import ProjectAssigned from "./models/projectAssignedModel";

import ProjectShot from "./models/projectShotModel";
import ShotAssigned from "./models/shotAssignedModel";

import ShotSubmission from "./models/shotSubmissionModel";
import ShotReview from "./models/shotReviewModel";

import Notification from "./models/notificationModel";

import Conversation from "./models/conversationModel";
import Message from "./models/messageModel";


if (!envConfig.connectionString) {

  throw new Error(
    "Missing DB_URI or DATABASE_URL environment variable"
  );

}


const sequelize = new Sequelize(
  envConfig.connectionString,
  {

    models: [

      User,

      Employee,

      Project,

      ProjectAssigned,

      ProjectShot,

      ShotAssigned,

      ShotSubmission,

      ShotReview,

      Notification,

      Conversation,

      Message,

    ],

  }
);


// =====================================================
// PROJECT MANAGER → PROJECT
// =====================================================

Project.belongsTo(User, {

  foreignKey: "projectManagerId",

  as: "projectManager",

});


User.hasMany(Project, {

  foreignKey: "projectManagerId",

  as: "managedProjects",

});


// =====================================================
// USER → EMPLOYEE
// =====================================================

Employee.belongsTo(User, {

  foreignKey: "userId",

  as: "employee",

});


User.hasOne(Employee, {

  foreignKey: "userId",

  as: "employee",

});


// =====================================================
// PROJECT → PROJECT ASSIGNED
// =====================================================

ProjectAssigned.belongsTo(Project, {

  foreignKey: "projectId",

  as: "project",

});


Project.hasMany(ProjectAssigned, {

  foreignKey: "projectId",

  as: "projectAssignments",

});


// =====================================================
// EMPLOYEE → PROJECT ASSIGNED
// =====================================================

ProjectAssigned.belongsTo(User, {

  foreignKey: "employeeId",

  as: "employee",

});


User.hasMany(ProjectAssigned, {

  foreignKey: "employeeId",

  as: "assignedProjects",

});


// =====================================================
// USER → PROJECT ASSIGNED BY
// =====================================================

ProjectAssigned.belongsTo(User, {

  foreignKey: "assignedBy",

  as: "assignedByUser",

});


User.hasMany(ProjectAssigned, {

  foreignKey: "assignedBy",

  as: "projectAssignmentsCreated",

});


// =====================================================
// PROJECT → PROJECT SHOT
// =====================================================

ProjectShot.belongsTo(Project, {

  foreignKey: "projectId",

  as: "project",

});


Project.hasMany(ProjectShot, {

  foreignKey: "projectId",

  as: "shots",

});


// =====================================================
// USER → PROJECT SHOT CREATED BY
// =====================================================

ProjectShot.belongsTo(User, {

  foreignKey: "createdBy",

  as: "creator",

});


User.hasMany(ProjectShot, {

  foreignKey: "createdBy",

  as: "createdShots",

});


// =====================================================
// PROJECT SHOT → SHOT ASSIGNED
// =====================================================

ShotAssigned.belongsTo(ProjectShot, {

  foreignKey: "shotId",

  as: "shot",

});


ProjectShot.hasOne(ShotAssigned, {

  foreignKey: "shotId",

  as: "assignment",

});


// =====================================================
// EMPLOYEE → SHOT ASSIGNED
// =====================================================

ShotAssigned.belongsTo(User, {

  foreignKey: "employeeId",

  as: "employee",

});


User.hasMany(ShotAssigned, {

  foreignKey: "employeeId",

  as: "assignedShots",

});


// =====================================================
// USER → SHOT ASSIGNED BY
// =====================================================

ShotAssigned.belongsTo(User, {

  foreignKey: "assignedBy",

  as: "assignedByUser",

});


User.hasMany(ShotAssigned, {

  foreignKey: "assignedBy",

  as: "shotAssignmentsCreated",

});


// =====================================================
// PROJECT SHOT → SUBMISSIONS
// =====================================================

ShotSubmission.belongsTo(ProjectShot, {

  foreignKey: "shotId",

  as: "shot",

});


ProjectShot.hasMany(ShotSubmission, {

  foreignKey: "shotId",

  as: "submissions",

});


// =====================================================
// EMPLOYEE → SUBMISSIONS
// =====================================================

ShotSubmission.belongsTo(User, {

  foreignKey: "submittedBy",

  as: "submitter",

});


User.hasMany(ShotSubmission, {

  foreignKey: "submittedBy",

  as: "submissions",

});


// =====================================================
// SUBMISSION → REVIEWS
// =====================================================

ShotReview.belongsTo(ShotSubmission, {

  foreignKey: "submissionId",

  as: "submission",

});


ShotSubmission.hasMany(ShotReview, {

  foreignKey: "submissionId",

  as: "reviews",

});


// =====================================================
// PROJECT MANAGER → REVIEWS
// =====================================================

ShotReview.belongsTo(User, {

  foreignKey: "reviewedBy",

  as: "reviewer",

});


User.hasMany(ShotReview, {

  foreignKey: "reviewedBy",

  as: "reviews",

});


// =====================================================
// CONVERSATION → USER ONE
// =====================================================

Conversation.belongsTo(User, {

  foreignKey: "userOneId",

  as: "userOne",

});


User.hasMany(Conversation, {

  foreignKey: "userOneId",

  as: "conversationsAsUserOne",

});


// =====================================================
// CONVERSATION → USER TWO
// =====================================================

Conversation.belongsTo(User, {

  foreignKey: "userTwoId",

  as: "userTwo",

});


User.hasMany(Conversation, {

  foreignKey: "userTwoId",

  as: "conversationsAsUserTwo",

});


// =====================================================
// CONVERSATION → MESSAGE
// =====================================================

Conversation.hasMany(Message, {

  foreignKey: "conversationId",

  as: "messages",

});


Message.belongsTo(Conversation, {

  foreignKey: "conversationId",

  as: "conversation",

});


// =====================================================
// USER → MESSAGE / SENDER
// =====================================================

Message.belongsTo(User, {

  foreignKey: "senderId",

  as: "sender",

});


User.hasMany(Message, {

  foreignKey: "senderId",

  as: "sentMessages",

});


// =====================================================
// NOTIFICATION → RECEIVER
// =====================================================

Notification.belongsTo(User, {

  foreignKey: "receiverId",

  as: "receiver",

});


User.hasMany(Notification, {

  foreignKey: "receiverId",

  as: "receivedNotifications",

});


// =====================================================
// NOTIFICATION → SENDER
// =====================================================

Notification.belongsTo(User, {

  foreignKey: "senderId",

  as: "sender",

});


User.hasMany(Notification, {

  foreignKey: "senderId",

  as: "sentNotifications",

});


// try {
//   sequelize
//     .authenticate()
//     .then(() => {
//       console.log("Database Connected Successfully!");
//     })
//     .catch((err: any) => {
//       console.log("Database Connection Error:", err);
//     });
// } catch (error) {
//   console.log(error);
// }

export default sequelize;
