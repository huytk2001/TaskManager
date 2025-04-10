import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import PrivateRoute from "./routes/privateRoute.jsx";
import SignUp from "./pages/Auth/SignUp.jsx";
import Login from "./pages/Auth/Login.jsx";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import ManageTask from "./pages/Admin/ManageTask.jsx";
import CreateTask from "./pages/Admin/CreateTask.jsx";
import ManageUsers from "./pages/Admin/ManageUsers.jsx";
import UserDashboard from "./pages/User/UserDashboard.jsx";
import MyTasks from "./pages/User/MyTasks.jsx";
import ViewTaksDetails from "./pages/User/ViewTaksDetails.jsx";
function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signUp" element={<SignUp />} />

          {/* Admin Route */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/task" element={<ManageTask />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>
          {/* User Route */}
          <Route element={<PrivateRoute allowdRoles={["users"]} />}>
            <Route path="/user/user-dashboard" element={<UserDashboard />} />
            <Route path="/user/my-tasks" element={<MyTasks />} />
            {/* {/* <Route path="/admin" element={<CreateTask />} /> */}
            <Route
              path="/user/task-details/:id"
              element={<ViewTaksDetails />}
            />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
