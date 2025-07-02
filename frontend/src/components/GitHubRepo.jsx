import styled from "styled-components";

const GitHubSection = styled.div`
  background-color: #0b1d2c;
  border: 1px solid #1cc7d1;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-top: 2rem;
  text-align: center;
  box-shadow: 0 0 8px rgba(28, 199, 209, 0.3);
`;

const GitHubLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: #15d4bc;
  font-weight: bold;
  text-decoration: none;
  gap: 0.5rem;
  font-size: 1.1rem;

  &:hover {
    color: #ff8c42;
  }
`;

const GitHubIcon = () => (
  <svg
    height="24"
    width="24"
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 ..."></path>
  </svg>
);

const GitHubRepo = () => (
  <GitHubSection>
    <GitHubLink
      href="https://github.com/youssefMoJo/safetube"
      target="_blank"
      rel="noopener noreferrer"
    >
      <GitHubIcon />
      View the Project on GitHub
    </GitHubLink>
  </GitHubSection>
);

export default GitHubRepo;
