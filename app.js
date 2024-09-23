const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session'); 

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up session management
app.use(session({
  secret: 'yourSecretKey', // Change this to a more secure secret
  resave: false,
  saveUninitialized: true,
}));

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Mayur@4517',  // Replace with your MySQL password
  database: 'college'        // Ensure this database exists in MySQL
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the MySQL database.');
  }
});

// // Home route
// app.get('/', (req, res) => {
//   res.redirect('/departments');
// });

// Home route (login page)
app.get('/', (req, res) => {
  res.render('login'); // Render the login page

});

// Handle role selection
app.post('/login', (req, res) => {
  const { role } = req.body;

  // Check if role is valid
  if (['admin', 'student', 'instructor'].includes(role)) {
    req.session.user = { role }; // Store user role in session
    if (role === 'Admin') {
      res.redirect('/departments');
    } else if (role === 'Student') {
      res.render('students');
    } else if (role === 'Instructor') {
      res.redirect('/instructors');
    }
  } else {
    res.redirect('/');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/login');
  });
});


// Department Routes
app.get('/departments', (req, res) => {
  db.query('SELECT * FROM department', (err, results) => {
    if (err) throw err;
    res.render('departments', { departments: results });
  });
});

app.post('/departments/add', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO department (name) VALUES (?)', [name], (err) => {
    if (err) throw err;
    res.redirect('/departments');
  });
});

app.post('/departments/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM department WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/departments');
  });
});

//edit routes

// Route to display the edit form for a specific department
app.get('/departments/edit/:id', (req, res) => {
  const departmentId = req.params.id;
  
  // Fetch department data by ID
  const department = departments.find(dept => dept.id === parseInt(departmentId));

  if (!department) {
      return res.status(404).send('Department not found');
  }

  // Render an edit form with pre-filled values
  res.render('edit_department', { department });
});

// app.get("/viewStudent",(req,res)=>{
//       res.render('viewStudent');
// })


// Instructor Routes
app.get('/instructors', (req, res) => {
  // Join instructors with departments to get the department names
  db.query(`
    SELECT instructor.id, instructor.name, department.name AS department_name 
    FROM instructor 
    LEFT JOIN department ON instructor.department_id = department.id
  `, (err, instructors) => {
    if (err) throw err;

    // Fetch all departments to populate the dropdown
    db.query('SELECT * FROM department', (err, departments) => {
      if (err) throw err;
      res.render('instructors', { instructors, departments });
    });
  });
});

app.post('/instructors/add', (req, res) => {
  const { name, department_id } = req.body;
  db.query('INSERT INTO instructor (name, department_id) VALUES (?, ?)', [name, department_id], (err) => {
    if (err) throw err;
    res.redirect('/instructors');
  });
});

app.post('/instructors/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM instructor WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/instructors');
  });
});




// Course Routes
app.get('/courses', (req, res) => {
  // Fetch all courses with their corresponding instructor names
  const coursesQuery = `
    SELECT course.id, course.name, instructor.name AS instructor_name 
    FROM course 
    LEFT JOIN instructor ON course.instructor_id = instructor.id
  `;

  // Fetch all instructors to populate the dropdown for adding a new course
  const instructorsQuery = 'SELECT * FROM instructor';

  db.query(coursesQuery, (err, courses) => {
    if (err) throw err;

    db.query(instructorsQuery, (err, instructors) => {
      if (err) throw err;

      // Render the view and pass both courses and instructors data
      res.render('courses', { courses, instructors });
    });
  });
});

app.post('/courses/add', (req, res) => {
  const { name, instructor_id } = req.body;
  db.query('INSERT INTO course (name, instructor_id) VALUES (?, ?)', [name, instructor_id], (err) => {
    if (err) throw err;
    res.redirect('/courses');
  });
});

app.post('/courses/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM course WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/courses');
  });
});


// Student Routes
app.get('/students', (req, res) => {
  db.query('SELECT * FROM student', (err, results) => {
    if (err) throw err;
    res.render('students', { students: results });
  });
});

app.post('/students/add', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO student (name) VALUES (?)', [name], (err) => {
    if (err) throw err;
    res.redirect('/students');
  });
});

app.post('/students/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM student WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/students');
  });
});

// Enrollment Routes
app.get('/enrollments', (req, res) => {
  // Fetch all enrollments with their corresponding student names and course names
  const enrollmentsQuery = `
    SELECT enrollment.student_id, enrollment.course_id, student.name AS student_name, course.name AS course_name
    FROM enrollment
    LEFT JOIN student ON enrollment.student_id = student.id
    LEFT JOIN course ON enrollment.course_id = course.id
  `;

  // Fetch all students to populate the dropdown for adding a new enrollment
  const studentsQuery = 'SELECT * FROM student';

  // Fetch all courses to populate the dropdown for adding a new enrollment
  const coursesQuery = 'SELECT * FROM course';

  db.query(enrollmentsQuery, (err, enrollments) => {
    if (err) throw err;

    db.query(studentsQuery, (err, students) => {
      if (err) throw err;

      db.query(coursesQuery, (err, courses) => {
        if (err) throw err;

        // Render the view and pass all necessary data
        res.render('enrollments', { enrollments, students, courses });
      });
    });
  });
});

app.post('/enrollments/add', (req, res) => {
  const { student_id, course_id } = req.body;
  db.query('INSERT INTO enrollment (student_id, course_id) VALUES (?, ?)', [student_id, course_id], (err) => {
    if (err) throw err;
    res.redirect('/enrollments');
  });
});

app.post('/enrollments/delete', (req, res) => {
  const { student_id, course_id } = req.body;
  db.query('DELETE FROM enrollment WHERE student_id = ? AND course_id = ?', [student_id, course_id], (err) => {
    if (err) throw err;
    res.redirect('/enrollments');
  });
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// STudents Views
app.get('/upload-marks', async (req, res) => {
  const students = await getStudents(); // Fetch students from DB
  const courses = await getCourses();   // Fetch courses from DB

  res.render('uploadMarks', { students, courses });
});

app.post('/marks/upload', async (req, res) => {
  const { student_id, course_id, marks } = req.body;
  const instructor_id = req.session.instructor_id;  // Assuming you are tracking instructor via session

  // Insert the uploaded marks into the database
  await db.query('INSERT INTO marks (student_id, course_id, marks, instructor_id) VALUES (?, ?, ?, ?)', 
      [student_id, course_id, marks, instructor_id]);

  res.redirect('/marks');  // Redirect to the marks viewing page
});

app.get("/uploadMarks",(req,res)=>{
        res.render('uploadMarks');
   })

   app.get("/viewMarks",(req,res)=>{
    res.render('viewMarks');
})

// Route to display marks

app.get('/marks', (req, res) => {
  // Replace with your actual database query
  const query = `
      SELECT students.name as student_name, courses.name as course_name, marks.marks
      FROM students
      JOIN marks ON students.id = marks.student_id
      JOIN courses ON marks.course_id = courses.id
  `;

  // Assuming you're using a database connection
  db.query(query, (err, result) => {
      if (err) {
          console.error('Error fetching student marks:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Ensure result is passed as 'students' to the view
      res.render('viewMarks', { students: result });
  });
});

