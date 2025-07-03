import styled from "styled-components";

const ScrollSection = styled.button`
  display: block;
  width: 100%;
  background-color: #0b1d2c;
  border: 1px solid #1cc7d1;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-top: 2rem;
  text-align: center;
  box-shadow: 0 0 8px rgba(28, 199, 209, 0.3);
  color: #15d4bc;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: #071621;
    color: #ff8c42;
  }

  &:focus {
    outline: 2px solid #1cc7d1;
    outline-offset: 2px;
  }
`;

const ArchitectureScrollCard = () => {
  const handleScroll = () => {
    const target = document.getElementById("architecture");
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.history.pushState(null, "", "#architecture");
    }
  };

  return (
    <ScrollSection onClick={handleScroll}>
      View Architecture Overview
    </ScrollSection>
  );
};

export default ArchitectureScrollCard;
