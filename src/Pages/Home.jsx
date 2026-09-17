import Header from "../Components/Header";
import About from "../Components/About";
import Skills from "../Components/Skills";
import Footer from "../Components/Footer";

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
