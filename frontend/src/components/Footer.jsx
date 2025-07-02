import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background-color: #0b1d2c;
  padding: 1rem 2rem;
  text-align: center;
  border-top: 1px solid #1cc7d1;
`;

const Text = styled.p`
  color: #e0f7fa;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.25rem 0;
`;

const Link = styled.a`
  color: #15d4bc;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <Text>
        © 2025 SafeTube.{" "}
        <Link href="https://youssefmohamed.ca/" target="_blank">
          Portfolio
        </Link>
      </Text>
    </FooterContainer>
  );
};

export default Footer;
