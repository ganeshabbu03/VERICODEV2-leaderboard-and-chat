import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courses, getAllLessons } from '../../data/courses.js';
import { getCompletedCountForCourse } from '../../utils/learnProgress.js';
import './learn.css';

function CourseList() {
  const [progressByCourseId, setProgressByCourseId] = useState({});

  useEffect(() => {
    const map = {};
    courses.forEach((course) => {
      const lessonIds = getAllLessons(course).map((l) => l.id);
      map[course.id] = {
        completed: getCompletedCountForCourse(course.id, lessonIds),
        total: lessonIds.length
      };
    });
    setProgressByCourseId(map);
  }, []);

  return (
    <div className="learn-page">
      <header className="learn-header">
        <div>
          <h1>Learn</h1>
          <p className="learn-subtitle">Pick a language and work through the curriculum at your own pace.</p>
        </div>
        <Link to="/dashboard" className="learn-back-link">&larr; Back to Dashboard</Link>
      </header>

      <div className="course-list">
        {courses.map((course) => {
          const progress = progressByCourseId[course.id] || { completed: 0, total: 0 };
          const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
          return (
            <Link key={course.id} to={`/learn/${course.id}`} className="course-card">
              <div className="course-card-top">
                <span className="course-language-dot" style={{ background: course.color }} />
                <span className="course-language-label">{course.language}</span>
                <span className="course-difficulty">{course.difficulty}</span>
              </div>
              <h3 className="course-card-title">{course.title}</h3>
              <p className="course-card-description">{course.description}</p>
              <div className="course-progress-row">
                <div className="course-progress-bar">
                  <div className="course-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="course-progress-label">
                  {progress.completed}/{progress.total} lessons
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default CourseList;
