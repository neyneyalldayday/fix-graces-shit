const inquirer = require("inquirer");
const mysql = require("mysql2");
require('console.table');



const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'company_db',
  // Enable logging by setting the 'debug' option to 'true'

});






function startApp() {
  console.log('hello')
  inquirer
    .prompt({
      type: 'list',
      name: 'action',
      message: 'Choose an option:',
      choices: [
        'Viewalldepartments',
        'Viewallroles',
        'Viewallemployees',
        'Addadepartment',
        'Addarole',
        'Addanemployee',
        'Updateanemployeerole',
        'Exit',
      ],
    
    })
    .then((answer) => {
      console.log("user selected: " + answer.action)
      switch (answer.action) {
        case 'Viewalldepartments':
          viewAllDepartments();
          break;
        case 'Viewallroles':
          viewAllRoles();
          break;
        case 'Viewallemployees':
          viewAllEmployees();
          break;
        case 'Addadepartment':
          addDepartment();
          break;
        case 'Addarole':
          addRole();
          break;
        case 'Addanemployee':
          addEmployee();
          break;
        case 'Updateanemployeerole':
          updateEmployeeRole();
          break;
        case 'Exit':
          // Handle exit
          quit()
          console.log('Exiting the application.');
          // Close the database connection if needed
          break;
       
      }
    });
}

function viewAllDepartments() {
  // const query = 'SELECT * FROM departments';

  pool.query("SELECT id AS department_id, name AS department_name FROM departments;",  function(err, results) {
    err? console.log(err): console.table(results, "hey wtf"), startApp();
  });
}

function viewAllRoles() {
  const query = 'SELECT r.id AS role_id,  r.title AS job_title,  r.salary,  d.name AS department_name FROM   roles r JOIN   departments d ON r.department_id = d.id;';

  pool.query(query, (err, results) => {
    if (err) throw err;

    // Display results in a formatted table
    console.table(results),

    // After displaying data, call startApp() to return to the main menu
    startApp();
  });
}


function viewAllEmployees() {
  const query = "SELECT  e.id AS employee_id,  e.first_name,  e.last_name,  r.title AS job_title,  d.name AS department,  r.salary,  CONCAT(m.first_name, ' ', m.last_name) AS manager_name FROM   employees e JOIN   roles r ON e.role_id = r.id JOIN   departments d ON r.department_id = d.id LEFT JOIN   employees m ON e.manager_id = m.id;";

  pool.query(query, (err, results) => {
    if (err) throw err;

    // Display results in a formatted table
    console.table(results),

    // After displaying data, call startApp() to return to the main menu
    startApp();
  });
}


function addDepartment() {
  inquirer
    .prompt({
      type: 'input',
      name: 'departmentName',
      message: 'Enter the name of the department:',
    })
    .then((answer) => {
      const query = 'INSERT INTO departments (name) VALUES (?)';

      pool.query(query, [answer.departmentName], (err, results) => {
        if (err) throw err;

        viewAllDepartments();        
      });
    });
}


function addRole() {
  pool.query("SELECT * FROM departments", function (err, results) {
    if (err) {
      console.log(err);
      return workTime();
    }
    const departmentChoices = results.map((department) => ({
      value: department.id,
      name: department.name,
    }));
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'roleTitle',
        message: 'Enter the title of the role:',
      },
      {
        type: 'input',
        name: 'roleSalary',
        message: 'Enter the salary for the role:',
      },
      {
        type: 'list',
        name: 'departmentId',
        message: 'Enter the department id for the role:',
        choices: departmentChoices
      },
    ])
    .then((answers) => {
      const query = 'INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)';

      pool.query(query, [answers.roleTitle, answers.roleSalary, answers.departmentId], (err, results) => {
        if (err) throw err;

        viewAllRoles();        
      });
    });
  });
}


function addEmployee() {
  pool.query("SELECT * FROM roles", function (err, results) {
    if (err) {
      console.log(err);
      return startApp();
    }

    const roleChoices = results.map((role) => ({
      value: role.id,
      name: role.title,
    }));
    pool.query("SELECT * FROM employees", function (err, employeeResults) {
      if (err) {
        console.log(err);
        return startApp();
      }

      const managerChoices = employeeResults.map((employee) => ({
        value: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
      }));

      // Add an option for no manager
      managerChoices.push({ value: null, name: "No Manager" });
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'firstName',
        message: 'Enter the employee\'s first name:',
      },
      {
        type: 'input',
        name: 'lastName',
        message: 'Enter the employee\'s last name:',
      },
      {
        type: 'list',
        name: 'roleId',
        message: 'Enter the role for the employee:',
        choices: roleChoices
      },
      {
        type: 'list',
        name: 'managerId',
        message: 'Enter the manager id for the employee:',
        choices: managerChoices
      },
    ])
    .then((answers) => {
      const query = 'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';

     pool.query(query, [answers.firstName, answers.lastName, answers.roleId, answers.managerId], (err, results) => {
        if (err) throw err;

        viewAllEmployees();       
      });
    
    });
  })
})
}


function updateEmployeeRole() {
  // Fetch existing employee data for user selection
  const query = 'SELECT id, CONCAT(first_name, " ", last_name) AS employee_name FROM employees';

  pool.query(query, (err, results) => {
    if (err) throw err;

    const employees = results.map((employee) => ({
      name: employee.employee_name,
      value: employee.id,
    }));


    pool.query("SELECT * FROM roles", function (err, results) {
      if (err) {
        console.log(err);
        return startApp();
      }
  
      const roleChoices = results.map((role) => ({
        value: role.id,
        name: role.title,
      }));

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: 'Select the employee to update:',
          choices: employees,
        },
        {
          type: 'list',
          name: 'newRoleId',
          message: 'Enter the new role for the employee:',
          choices: roleChoices
        },
      ])
      .then((answers) => {
        const updateQuery = 'UPDATE employees SET role_id = ? WHERE id = ?';

        pool.query(updateQuery, [answers.newRoleId, answers.employeeId], (updateErr, updateResults) => {
          if (updateErr) throw updateErr;

          viewAllEmployees();          
        });
      });
  });
});
}


function quit() {
  process.on('exit', () => {
    console.log('Closing the database connection.');
    connection.end();
  });
}

// You would need to call startApp() to begin the application
startApp();



// function backToMainMenu() {
//   inquirer
//     .prompt({
//       type: 'confirm',
//       name: 'back',
//       message: 'Return to the main menu?',
//       default: true,
//     })
//     .then((answer) => {
//       if (answer.back) {
//         startApp();
//       } else {
//         console.log('Exiting the application.');
//       }
//     });
// }

// console.table(results);
// backToMainMenu();

// Close the database connection when the application is finished

