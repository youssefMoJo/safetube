import styled from "styled-components";
import architectureImage from "../assets/safetube_backend_architecture.png";

const Section = styled.section`
  background-color: #071621;
  padding: 3rem 1rem;
  text-align: center;
  border-top: 1px solid #1cc7d1;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #15d4bc;
  margin-bottom: 1rem;
`;

const Blurb = styled.p`
  color: #e0f7fa;
  max-width: 700px;
  margin: 0 auto 2rem;
  font-size: 1rem;
  line-height: 1.5;
`;

const Image = styled.img`
  max-width: 100%;
  height: auto;
  border: 2px solid #1cc7d1;
  border-radius: 8px;
`;

const ArchitectureSection = () => {
  return (
    <Section>
      <Title>Architecture Overview</Title>
      <Blurb>
        SafeTube uses AWS services to deliver a secure, scalable video platform.
        The architecture includes Cognito for authentication, API Gateway,
        Lambda, SQS, ECS Fargate, S3 for video storage, DynamoDB for the
        database, CloudFront for secure video streaming to the child — and more.
        Take a look 😎
      </Blurb>
      <Image
        id="architecture"
        src={architectureImage}
        alt="SafeTube Backend Architecture"
      />
    </Section>
  );
};

export default ArchitectureSection;
