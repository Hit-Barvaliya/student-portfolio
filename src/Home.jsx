import Header from "./Header";
import About from "./About";
import Skills from "./Skills";
import Footer from "./Footer";

function Home() {
  const skills = ["HTML", "CSS", "JavaScript", "React", "Vite", "Git"];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <Header name="Hit Barvaliya" />
      <About />
      <Skills skillList={skills} />
      <Footer />
    </div>
  );
}

export default Home;
