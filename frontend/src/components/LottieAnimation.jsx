import { Player } from "@lottiefiles/react-lottie-player";
import styled from "styled-components";
import codingAnimationData from "../assets/coding.json";

const AnimationWrapper = styled.div`
  margin-top: 2rem;
  max-width: 300px;
  width: 100%;

  /* Center horizontally */
  margin-left: auto;
  margin-right: auto;
`;

const LottieAnimation = () => {
  return (
    <AnimationWrapper>
      <Player
        autoplay
        loop
        src={codingAnimationData}
        style={{ width: "100%", height: "100%" }}
      />
    </AnimationWrapper>
  );
};

export default LottieAnimation;
