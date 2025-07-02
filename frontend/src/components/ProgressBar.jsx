import styled from "styled-components";

const ProgressContainer = styled.div`
  background-color: #071621;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 2px solid #1cc7d1;
  border-bottom: 2px solid #1cc7d1;
`;

const SingleBarContainer = styled.div`
  margin-bottom: 2rem;
  width: 100%;
  max-width: 500px;
`;

const Label = styled.p`
  font-size: 1.1rem;
  color: #e0f7fa;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const BarBackground = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  background-color: #0b1d2c;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #1cc7d1;
  box-shadow: inset 0 0 5px rgba(28, 199, 209, 0.3);
`;

const BarFill = styled.div`
  height: 100%;
  width: ${(props) => props.percent}%;
  background: linear-gradient(to right, #1cc7d1, #ff8c42);
  border-radius: 12px 0 0 12px;
  transition: width 0.5s ease;
`;

const PercentageLabel = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #e0f7fa;
  font-size: 0.9rem;
`;

const ProgressBar = ({ backendPercent, frontendPercent }) => {
  return (
    <ProgressContainer>
      <SingleBarContainer>
        <Label>Backend Development Progress</Label>
        <BarBackground>
          <BarFill percent={backendPercent} />
          <PercentageLabel>{backendPercent}%</PercentageLabel>
        </BarBackground>
      </SingleBarContainer>

      <SingleBarContainer>
        <Label>Frontend Development Progress</Label>
        <BarBackground>
          <BarFill percent={frontendPercent} />
          <PercentageLabel>{frontendPercent}%</PercentageLabel>
        </BarBackground>
      </SingleBarContainer>
    </ProgressContainer>
  );
};

export default ProgressBar;
