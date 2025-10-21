const mongoose = require("mongoose");
const NotificationTemplate = require("../../models/notificationTemplateModel");

/**
 * Seed notification templates for various events in the system
 */
async function seedNotificationTemplates() {
  try {
    console.log("Checking and creating notification templates...");

    // Define templates
    const templates = [
      // Existing templates
      {
        type: "new_subject",
        title: "New Subject Available",
        message: "A new subject {subject} is now available for your level",
      },
      {
        type: "new_lecture",
        title: "New Lecture Available",
        message: "A new lecture {lecture} is now available in {subject}",
      },
      {
        type: "new_container",
        title: "New Container Available",
        message: "A new container {container} is now available in {subject}",
      },
      {
        type: "new_homework",
        title: "New Homework Submission",
        message: "Student {student} has submitted homework for {lecture}",
      },

      // New templates for student notifications
      {
        type: "new_attachment",
        title: "New Material Added",
        message: "New {type} material has been added to lecture {lecture}",
      },
      {
        type: "new_exam",
        title: "New Exam Available",
        message: "A new exam has been added to lecture {lecture}",
      },
      {
        type: "new_homework_assignment",
        title: "New Homework Assignment",
        message:
          "A new homework assignment has been added to lecture {lecture}",
      },
      {
        type: "lecture_updated",
        title: "Lecture Updated",
        message: "The lecture {lecture} has been updated: {update}",
      },
    ];

    // For each template, create if it doesn't exist
    for (const template of templates) {
      const exists = await NotificationTemplate.findOne({
        type: template.type,
      });
      if (!exists) {
        await NotificationTemplate.create(template);
        console.log(`Created notification template for ${template.type}`);
      } else {
        console.log(
          `Notification template for ${template.type} already exists`
        );
      }
    }

    console.log("Notification templates check completed");
  } catch (error) {
    console.error("Error seeding notification templates:", error);
  }
}

module.exports = seedNotificationTemplates;
