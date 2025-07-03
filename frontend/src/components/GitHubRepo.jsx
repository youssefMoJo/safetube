import styled from "styled-components";

const GitHubSection = styled.a`
  display: block;
  background-color: #0b1d2c;
  border: 1px solid #1cc7d1;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-top: 2rem;
  text-align: center;
  box-shadow: 0 0 8px rgba(28, 199, 209, 0.3);
  color: #15d4bc;
  font-weight: bold;
  text-decoration: none;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #071621;
    color: #ff8c42;
  }
`;

const GitHubRepo = () => (
  <GitHubSection
    href="https://github.com/youssefMoJo/safetube"
    target="_blank"
    rel="noopener noreferrer"
  >
    View the Project on GitHub
  </GitHubSection>
);

export default GitHubRepo;
