import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProblemList from './components/Practice/ProblemList.jsx';
import ProblemSolve from './components/Practice/ProblemSolve.jsx';
import CourseList from './components/Learn/CourseList.jsx';
import CourseView from './components/Learn/CourseView.jsx';
import Team from './components/Team.jsx';
import NotFound from './components/NotFound.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice" element={<ProblemList />} />
        <Route path="/practice/:id" element={<ProblemSolve />} />
        <Route path="/learn" element={<CourseList />} />
        <Route path="/learn/:courseId" element={<CourseView />} />
        <Route path="/learn/:courseId/:lessonId" element={<CourseView />} />
        <Route path="/team" element={<Team />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
