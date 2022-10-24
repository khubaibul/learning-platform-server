const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());

const allCourses = require("./data/jsonData/course/course.json");

app.get("/", (req, res) => {
    res.send("CSE FROM HOME SERVER IS RUNNING....")
})

app.get("/courses", (req, res) => {
    res.send(allCourses);
})
app.get("/course/:id", (req, res) => {
    const id = req.params.id;

    const requestedCourse = allCourses.find(course => course.courseId == id);
    res.send(requestedCourse);
})

app.listen(port, () => {
    console.log("CSE From Server Is Running on ", port)
})