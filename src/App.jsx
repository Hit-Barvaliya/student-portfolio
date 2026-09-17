
import { Routes, Route } from "react-router-dom";

import "./App.css";


import Navbar from "./Components/Navbar";
import Home from "./Pages/Home";
import Projects from "./Pages/Projects";
import Contact from "./Pages/Contact";
import TaskManager from "./Pages/TaskManager";

//------------------------------------------------

function App() {
 
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/projects" element={<Projects />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/tasks" element={<TaskManager />} />
      </Routes>

      

    </>
  );
}

export default App;
