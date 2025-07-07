import "./index.css";
import Header from "./components/Header";
import CountdownTimer from "./components/CountdownTimer";
import ProgressBar from "./components/ProgressBar";
import FeaturesList from "./components/FeaturesList";
import ArchitectureSection from "./components/ArchitectureSection";
import Footer from "./components/Footer";
import GitHubRepo from "./components/GitHubRepo";
import ArchitectureScrollCard from "./components/ArchitectureScrollCard";
import { useEffect } from "react";

import styled from "styled-components";

const LaunchSection = styled.section`
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0b1d2c 0%, #071621 100%);
  border-top: 2px solid #1cc7d1;
  border-bottom: 2px solid #1cc7d1;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
    align-items: stretch;
  }
`;

const TimerWrapper = styled.div`
  flex: 1;
  padding: 2rem 1rem;
  border-bottom: 2px solid #1cc7d1;

  @media (min-width: 768px) {
    border-bottom: none;
    border-right: 2px solid #1cc7d1;
  }
`;

const ProgressWrapper = styled.div`
  flex: 1;
  padding: 2rem 1rem;
`;

function App() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, []);

  return (
    <div className="App">
      <Header />
      <LaunchSection>
        <TimerWrapper>
          <CountdownTimer targetDate="2025-08-01T00:00:00" />
        </TimerWrapper>
        <ProgressWrapper>
          <ProgressBar backendPercent={75} frontendPercent={10} />
          <GitHubRepo />
          <ArchitectureScrollCard />
        </ProgressWrapper>
      </LaunchSection>
      <FeaturesList />
      <ArchitectureSection id="architecture" />
      <Footer />
    </div>
  );
}

export default App;
