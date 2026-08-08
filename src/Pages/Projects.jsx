import { useEffect, useState } from "react";
import "../Projects.css";

const GITHUB_USERNAME = "Hit-Barvaliya";

function Spinner() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" />
      <p>Loading repositories...</p>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message">
      <p>Failed to load repositories: {message}</p>
      <button className="retry-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos`
      );

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message || "Unable to fetch repositories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Spinner />;

  if (error) return <ErrorMessage message={error} onRetry={fetchRepos} />;

  return (
    <section className="projects-container">
      <h1 className="projects-heading">GitHub Repositories</h1>

      <div className="projects-controls">
        <input
          className="repo-search"
          type="search"
          placeholder="Search repositories by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <p className="repo-summary">
          Showing {filteredRepos.length} of {repos.length} repositories
        </p>
      </div>

      {filteredRepos.length === 0 ? (
        <div className="no-results">No repositories match your search.</div>
      ) : (
        <div className="projects-grid">
          {filteredRepos.map((repo) => (
            <article className="project-card" key={repo.id}>
              <div className="project-header">
                <h2>{repo.name}</h2>
                <span className="repo-stars">{repo.stargazers_count}</span>
              </div>


              <a
                className="project-link"
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Projects;